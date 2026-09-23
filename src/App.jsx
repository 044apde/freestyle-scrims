import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, 
  ListOrdered, 
  Undo2, 
  Lock, 
  Users, 
  Trophy, 
  Sword, 
  UserPlus, 
  LogOut,
  Swords
} from 'lucide-react';

// 고유 ID 생성기
const generateId = () => Math.random().toString(36).substring(2, 9);

// 토너먼트 대진표(Bracket) 자동 생성 및 승급 처리 로직
const propagateTournament = (matches) => {
  let updated = matches.map(m => ({ ...m }));
  
  // 라운드 2 이상의 진출팀 슬롯을 초기화한 후 아래에서부터 다시 채워 올립니다 (완벽한 롤백/재계산 지원)
  updated.forEach(m => {
    if (m.round > 1) {
      m.team1Id = null;
      m.team2Id = null;
    }
  });

  let changed = true;
  while (changed) {
    changed = false;
    updated.forEach(m => {
      if (m.winnerId && m.nextMatchId) {
        const nextMatch = updated.find(x => x.id === m.nextMatchId);
        if (nextMatch) {
          if (!nextMatch.team1Id && nextMatch.team2Id !== m.winnerId) {
            nextMatch.team1Id = m.winnerId;
            changed = true;
          } else if (!nextMatch.team2Id && nextMatch.team1Id !== m.winnerId) {
            nextMatch.team2Id = m.winnerId;
            changed = true;
          }
        }
      }
    });
  }
  
  // 승리 팀이 슬롯에서 사라진 경우 우승 기록도 취소 (롤백 처리용)
  updated.forEach(m => {
    if (m.winnerId && m.winnerId !== 'dummy' && m.winnerId !== m.team1Id && m.winnerId !== m.team2Id) {
      if (!m.isBye) {
        m.winnerId = null;
        m.completedAt = null;
      }
    }
  });

  return updated;
};

const generateBracket = (teams) => {
  if (teams.length < 2) return [];
  const p = Math.pow(2, Math.ceil(Math.log2(teams.length)));
  const rounds = Math.log2(p);
  let matches = [];
  let matchCounter = 1;

  let currentRoundMatches = [];
  const finalMatch = { id: `m_${Date.now()}_${matchCounter++}`, round: rounds, team1Id: null, team2Id: null, winnerId: null, nextMatchId: null, name: '결승전' };
  matches.push(finalMatch);
  currentRoundMatches.push(finalMatch);

  // 트리 구조 생성 (결승 -> 4강 -> 8강 역순)
  for (let r = rounds - 1; r >= 1; r--) {
    let prevRoundMatches = [];
    for (let nextMatch of currentRoundMatches) {
      const m1 = { id: `m_${Date.now()}_${matchCounter++}`, round: r, team1Id: null, team2Id: null, winnerId: null, nextMatchId: nextMatch.id, name: `${Math.pow(2, rounds - r + 1)}강` };
      const m2 = { id: `m_${Date.now()}_${matchCounter++}`, round: r, team1Id: null, team2Id: null, winnerId: null, nextMatchId: nextMatch.id, name: `${Math.pow(2, rounds - r + 1)}강` };
      matches.push(m1, m2);
      prevRoundMatches.push(m1, m2);
    }
    currentRoundMatches = prevRoundMatches;
  }

  // 1라운드(Leaf Nodes)에 팀 배정
  let shuffled = [...teams].sort(() => Math.random() - 0.5);
  let teamIdx = 0;
  for (let leaf of currentRoundMatches) {
    if (teamIdx < shuffled.length) leaf.team1Id = shuffled[teamIdx++].id;
  }
  for (let leaf of currentRoundMatches) {
    if (teamIdx < shuffled.length) leaf.team2Id = shuffled[teamIdx++].id;
  }

  // 부전승(Bye) 자동 처리
  matches.forEach(m => {
    if (m.round === 1) {
      if (m.team1Id && !m.team2Id) {
        m.winnerId = m.team1Id;
        m.isBye = true;
      } else if (!m.team1Id && m.team2Id) {
        m.winnerId = m.team2Id;
        m.isBye = true;
      }
    }
  });

  return propagateTournament(matches).sort((a,b) => a.round - b.round);
};

export default function App() {
  // LocalStorage를 활용한 데이터 영구 보존
  const [players, setPlayers] = useState(() => JSON.parse(localStorage.getItem('fs_players')) || []);
  const [tournaments, setTournaments] = useState(() => JSON.parse(localStorage.getItem('fs_tourneys')) || []);
  const [activePlayerId, setActivePlayerId] = useState(() => localStorage.getItem('fs_active_id') || null);
  
  // 데이터 변경 시 LocalStorage 업데이트
  useEffect(() => localStorage.setItem('fs_players', JSON.stringify(players)), [players]);
  useEffect(() => localStorage.setItem('fs_tourneys', JSON.stringify(tournaments)), [tournaments]);
  useEffect(() => {
    if (activePlayerId) localStorage.setItem('fs_active_id', activePlayerId);
    else localStorage.removeItem('fs_active_id');
  }, [activePlayerId]);

  // UI States
  const [activeTab, setActiveTab] = useState('current');
  const [nicknameInput, setNicknameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentUserProfile = players.find(p => p.id === activePlayerId);
  const activeTournament = tournaments.find(t => t.status !== 'FINISHED') || tournaments[tournaments.length - 1];
  const isHost = activeTournament?.hostId === activePlayerId;

  // 자동 계산되는 랭킹 보드 (개인별 누적 승/패/승점)
  const leaderboard = useMemo(() => {
    const stats = {};
    players.forEach(p => {
      stats[p.id] = { ...p, wins: 0, losses: 0, points: 0, matchesPlayed: 0 };
    });

    tournaments.forEach(t => {
      if (!t.matches) return;
      t.matches.forEach(m => {
        if (!m.winnerId || m.isBye) return;
        
        const t1 = t.teams.find(team => team.id === m.team1Id);
        const t2 = t.teams.find(team => team.id === m.team2Id);
        if (!t1 || !t2) return;

        const isT1Win = m.winnerId === t1.id;
        
        // 팀원별 점수 부여 (승리 +3점, 패배 +1점)
        t1.players.forEach(pid => {
          if (!stats[pid]) return;
          stats[pid].matchesPlayed++;
          if (isT1Win) { stats[pid].wins++; stats[pid].points += 3; }
          else { stats[pid].losses++; stats[pid].points += 1; }
        });

        t2.players.forEach(pid => {
          if (!stats[pid]) return;
          stats[pid].matchesPlayed++;
          if (!isT1Win) { stats[pid].wins++; stats[pid].points += 3; }
          else { stats[pid].losses++; stats[pid].points += 1; }
        });
      });
    });
    return Object.values(stats).sort((a, b) => b.points - a.points || b.wins - a.wins);
  }, [players, tournaments]);

  // 역대 전체 매치 기록 추출
  const pastMatches = useMemo(() => {
    return tournaments
      .flatMap(t => (t.matches || []).filter(m => m.winnerId && !m.isBye).map(m => ({ ...m, tourneyName: t.name, teams: t.teams })))
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  }, [tournaments]);

  const handleAuth = (e) => {
    e.preventDefault();
    if (!nicknameInput.trim() || pinInput.length !== 4) {
      setErrorMsg("닉네임과 4자리 비밀번호를 정확히 입력해주세요.");
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    const existingPlayer = players.find(p => p.nickname === nicknameInput.trim());

    if (existingPlayer) {
      if (existingPlayer.pin === pinInput.trim()) setActivePlayerId(existingPlayer.id);
      else {
        setErrorMsg("비밀번호가 일치하지 않습니다.");
        setTimeout(() => setErrorMsg(''), 3000);
      }
    } else {
      const newId = generateId();
      setPlayers([...players, { id: newId, nickname: nicknameInput.trim(), pin: pinInput.trim(), createdAt: Date.now() }]);
      setActivePlayerId(newId);
    }
  };

  const handleCreateTournament = () => {
    const newTourney = {
      id: generateId(),
      name: `${new Date().toLocaleDateString()} 정규 내전`,
      hostId: activePlayerId,
      status: 'RECRUITING',
      participants: [{ id: activePlayerId, nickname: currentUserProfile.nickname }],
      teams: [],
      matches: []
    };
    setTournaments([...tournaments, newTourney]);
    setActiveTab('current');
  };

  const handleAddDummyPlayers = () => {
    if (!activeTournament || !isHost) return;
    const bots = Array.from({ length: 8 }, (_, i) => {
      const id = generateId();
      return { id, nickname: `테스트봇${i + 1}`, pin: '0000', createdAt: Date.now() };
    });
    
    // DB(상태)에 봇 등록
    setPlayers([...players, ...bots]);
    
    // 현재 내전에 봇 참가
    const updatedTournaments = tournaments.map(t => {
      if (t.id === activeTournament.id) {
        const newParticipants = [...t.participants];
        bots.forEach(b => newParticipants.push({ id: b.id, nickname: b.nickname }));
        return { ...t, participants: newParticipants };
      }
      return t;
    });
    setTournaments(updatedTournaments);
  };

  const handleGenerateTeamsAndBracket = (type) => {
    if (!activeTournament || !isHost) return;
    
    // 팀 생성 (3명씩 랜덤 묶기)
    const shuffled = [...activeTournament.participants].sort(() => Math.random() - 0.5);
    const teams = [];
    const teamSize = 3;
    for (let i = 0; i < shuffled.length; i += teamSize) {
      const chunk = shuffled.slice(i, i + teamSize);
      teams.push({
        id: `team_${generateId()}`,
        name: `${i / teamSize + 1}팀`,
        players: chunk.map(p => p.id)
      });
    }

    let matches = [];
    if (type === 'tournament') {
      matches = generateBracket(teams);
    } else if (type === 'league') {
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          matches.push({
            id: `m_league_${generateId()}`,
            round: 1,
            team1Id: teams[i].id,
            team2Id: teams[j].id,
            winnerId: null,
            name: '풀리그'
          });
        }
      }
    }

    setTournaments(prev => prev.map(t => 
      t.id === activeTournament.id ? { ...t, status: 'PLAYING', teams, matches } : t
    ));
    setActiveTab('bracket');
  };

  const handleSetMatchWinner = (matchId, winnerTeamId) => {
    setTournaments(prev => prev.map(t => {
      if (t.id !== activeTournament?.id) return t;
      let newMatches = t.matches.map(m => 
        m.id === matchId ? { ...m, winnerId: winnerTeamId, completedAt: winnerTeamId ? Date.now() : null } : m
      );
      
      // 토너먼트인 경우 자동 승급/롤백 처리
      if (newMatches.some(m => m.nextMatchId)) {
        newMatches = propagateTournament(newMatches);
      }
      
      return { ...t, matches: newMatches };
    }));
  };

  const handleEndTournament = () => {
    if (window.confirm('내전을 종료하시겠습니까? 종료된 내전 데이터는 전체 랭킹에 합산됩니다.')) {
      setTournaments(prev => prev.map(t => t.id === activeTournament.id ? { ...t, status: 'FINISHED' } : t));
    }
  };

  const handleResetPin = (playerId) => {
    if (!isHost) return;
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, pin: '0000' } : p));
    alert("해당 선수의 비밀번호가 '0000'으로 초기화되었습니다.");
  };

  if (!activePlayerId || !currentUserProfile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="bg-orange-500 p-4 rounded-full">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-white mb-2">내전 입장</h2>
          <p className="text-slate-400 text-center mb-8 text-sm">
            처음오셨다면 사용할 닉네임과 4자리 비밀번호를 입력하여 자동 등록됩니다.<br/>
            이미 가입하셨다면 기존 정보를 입력해주세요.
          </p>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="text"
              placeholder="인게임 닉네임"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
              maxLength={15} required
            />
            <input
              type="password"
              placeholder="비밀번호 4자리 (숫자)"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors tracking-[0.5em] font-mono text-center"
              maxLength={4} required
            />
            {errorMsg && <p className="text-red-500 text-sm text-center">{errorMsg}</p>}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform transition active:scale-95"
            >
              입장하기
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Sword className="text-white w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight hidden sm:block">프리스타일 리부트</h1>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'current', icon: Users, label: '현재 내전' },
              { id: 'bracket', icon: Swords, label: '대진표/결과' },
              { id: 'history', icon: History, label: '경기 기록' },
              { id: 'ranking', icon: Trophy, label: '종합 랭킹' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-full text-white">
              <span className="text-orange-500 mr-1">●</span>{currentUserProfile.nickname}
            </span>
            <button onClick={() => { setActivePlayerId(null); setPinInput(''); }} className="text-slate-500 hover:text-white">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto p-4 pb-24">
        
        {/* TAB: Current Scrim (모집 중) */}
        {activeTab === 'current' && (
          <div className="space-y-6">
            {!activeTournament || activeTournament.status === 'FINISHED' ? (
              <div className="text-center py-20 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
                <Users size={64} className="mx-auto text-slate-700 mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2">현재 진행 중인 내전이 없습니다</h2>
                <p className="text-slate-400 mb-8">방장이 되어 새로운 내전을 개최하고 인원을 모집하세요.</p>
                <button onClick={handleCreateTournament} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-orange-500/20 transition-all">
                  새 내전 개최하기
                </button>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>
                      {activeTournament.name}
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">상태: {activeTournament.status === 'RECRUITING' ? '모집 중' : '진행 중'}</p>
                  </div>
                  {isHost && activeTournament.status === 'RECRUITING' && (
                    <button onClick={handleAddDummyPlayers} className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded text-sm transition">
                      <UserPlus size={16} /> 테스트봇 추가
                    </button>
                  )}
                </div>

                {activeTournament.status === 'RECRUITING' && (
                  <>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6">
                      <h3 className="font-bold text-white mb-4">참가자 목록 ({activeTournament.participants.length}명)</h3>
                      <div className="flex flex-wrap gap-2">
                        {activeTournament.participants.map(p => (
                          <div key={p.id} className="bg-slate-800 px-3 py-1.5 rounded-lg text-sm text-slate-300">
                            {p.nickname}
                          </div>
                        ))}
                      </div>
                      {!activeTournament.participants.some(p => p.id === activePlayerId) && (
                        <button 
                          onClick={() => setTournaments(prev => prev.map(t => t.id === activeTournament.id ? { ...t, participants: [...t.participants, { id: activePlayerId, nickname: currentUserProfile.nickname }] } : t))}
                          className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg"
                        >
                          내전 참가 신청
                        </button>
                      )}
                    </div>
                    {isHost && activeTournament.participants.length >= 2 && (
                      <div className="flex gap-4">
                        <button onClick={() => handleGenerateTeamsAndBracket('tournament')} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg">
                          단판 토너먼트 대진 생성
                        </button>
                        <button onClick={() => handleGenerateTeamsAndBracket('league')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-lg">
                          풀리그 대진 생성
                        </button>
                      </div>
                    )}
                  </>
                )}

                {activeTournament.status === 'PLAYING' && (
                  <div className="text-center py-10">
                    <h3 className="text-xl font-bold text-white mb-4">팀 배정이 완료되었습니다!</h3>
                    <p className="text-slate-400 mb-6">상단의 '대진표/결과' 탭으로 이동하여 경기를 시작하세요.</p>
                    <button onClick={() => setActiveTab('bracket')} className="bg-orange-500 text-white px-6 py-2 rounded-lg font-bold">
                      대진표 보러가기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB: Bracket / Matches */}
        {activeTab === 'bracket' && (
          <div className="space-y-6">
            {!activeTournament || activeTournament.matches.length === 0 ? (
              <div className="text-center py-20 text-slate-500">생성된 대진표가 없습니다.</div>
            ) : (
              <>
                {isHost && (
                  <div className="flex justify-end mb-4">
                    <button onClick={handleEndTournament} className="bg-red-900/50 hover:bg-red-900 text-red-400 px-4 py-2 rounded-lg text-sm font-bold border border-red-800 transition">
                      이 내전 강제 종료하기
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTournament.matches.map(match => {
                    const t1 = activeTournament.teams.find(t => t.id === match.team1Id);
                    const t2 = activeTournament.teams.find(t => t.id === match.team2Id);
                    const isFinished = !!match.winnerId;
                    
                    // 권한: 방장이거나 해당 매치에 소속된 팀원만 결과 입력 가능
                    const isParticipant = t1?.players.includes(activePlayerId) || t2?.players.includes(activePlayerId);
                    const canInputResult = !isFinished && (isParticipant || isHost);

                    if (match.isBye) return null; // 부전승 매치는 숨김 처리

                    return (
                      <div key={match.id} className={`bg-slate-900 border rounded-2xl p-5 shadow-lg relative ${isFinished ? 'border-slate-800 opacity-60' : 'border-orange-500/50'}`}>
                        <div className="absolute -top-3 left-4 bg-slate-950 border border-slate-700 px-3 py-1 rounded-full text-xs font-bold text-orange-400">
                          {match.name || '매치'}
                        </div>
                        {isFinished && isHost && (
                          <button onClick={() => handleSetMatchWinner(match.id, null)} className="absolute top-4 right-4 text-xs text-slate-400 hover:text-red-400 underline flex items-center gap-1">
                            <Undo2 size={12}/> 결과 되돌리기
                          </button>
                        )}
                        
                        <div className="flex justify-between items-stretch mt-4 gap-4">
                          {/* Team 1 */}
                          <div className="flex-1 bg-slate-950 rounded-xl p-4 flex flex-col items-center justify-center text-center border border-slate-800">
                            <div className={`text-lg font-bold mb-2 ${match.winnerId === t1?.id ? 'text-green-400' : 'text-white'}`}>
                              {t1 ? t1.name : '승자 대기 중...'}
                            </div>
                            <div className="text-xs text-slate-500 mb-3 line-clamp-2">
                              {t1 ? t1.players.map(pid => players.find(p=>p.id===pid)?.nickname).join(', ') : '-'}
                            </div>
                            {canInputResult && t1 && t2 && (
                              <button onClick={() => handleSetMatchWinner(match.id, t1.id)} className="w-full bg-slate-800 hover:bg-green-600 text-white text-xs font-bold py-2 rounded transition">
                                {t1.players.includes(activePlayerId) ? '🏆 우리팀 승리' : '승리 기록'}
                              </button>
                            )}
                          </div>
                          
                          <div className="flex flex-col justify-center font-black text-slate-600 text-xl italic">VS</div>
                          
                          {/* Team 2 */}
                          <div className="flex-1 bg-slate-950 rounded-xl p-4 flex flex-col items-center justify-center text-center border border-slate-800">
                            <div className={`text-lg font-bold mb-2 ${match.winnerId === t2?.id ? 'text-green-400' : 'text-white'}`}>
                              {t2 ? t2.name : '승자 대기 중...'}
                            </div>
                            <div className="text-xs text-slate-500 mb-3 line-clamp-2">
                              {t2 ? t2.players.map(pid => players.find(p=>p.id===pid)?.nickname).join(', ') : '-'}
                            </div>
                            {canInputResult && t1 && t2 && (
                              <button onClick={() => handleSetMatchWinner(match.id, t2.id)} className="w-full bg-slate-800 hover:bg-green-600 text-white text-xs font-bold py-2 rounded transition">
                                {t2.players.includes(activePlayerId) ? '🏆 우리팀 승리' : '승리 기록'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB: History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><History size={20} /> 역대 매치 기록</h2>
            {pastMatches.length === 0 ? (
              <div className="text-center py-10 text-slate-500">기록된 경기가 없습니다.</div>
            ) : (
              pastMatches.map((match, idx) => {
                const t1 = match.teams.find(t => t.id === match.team1Id);
                const t2 = match.teams.find(t => t.id === match.team2Id);
                return (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-slate-500 w-full sm:w-1/4 text-center sm:text-left">
                      <div className="font-bold text-orange-500/80 mb-1">{match.tourneyName}</div>
                      {new Date(match.completedAt).toLocaleString()}
                    </div>
                    <div className="flex-1 flex justify-center items-center gap-6 w-full">
                      <div className={`text-right w-1/3 ${match.winnerId === t1?.id ? 'text-green-400 font-bold' : 'text-slate-400'}`}>
                        {t1?.name}
                      </div>
                      <div className="text-slate-600 text-xs font-black bg-slate-950 px-2 py-1 rounded">VS</div>
                      <div className={`text-left w-1/3 ${match.winnerId === t2?.id ? 'text-green-400 font-bold' : 'text-slate-400'}`}>
                        {t2?.name}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB: Ranking */}
        {activeTab === 'ranking' && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy size={24} className="text-orange-500" /> 종합 누적 랭킹
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">순위</th>
                    <th className="px-6 py-4">닉네임</th>
                    <th className="px-6 py-4 text-center">승점</th>
                    <th className="px-6 py-4 text-center">전적 (승/패)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {leaderboard.map((player, idx) => (
                    <tr key={player.id} className={`hover:bg-slate-800/50 transition-colors ${player.id === activePlayerId ? 'bg-orange-900/10' : ''}`}>
                      <td className="px-6 py-4 font-medium">
                        {idx < 3 ? <span className="text-xl font-black text-orange-500">{idx + 1}</span> : <span className="text-slate-500">{idx + 1}</span>}
                      </td>
                      <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                        {player.nickname}
                        {isHost && player.id !== activePlayerId && (
                          <button onClick={() => handleResetPin(player.id)} className="ml-2 text-[10px] bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 border border-slate-700 rounded px-2 py-0.5 transition">
                            비밀번호 초기화
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-black text-orange-400 text-lg">
                        {player.points}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-400">
                        {player.wins}승 {player.losses}패
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}