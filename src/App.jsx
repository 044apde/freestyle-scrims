import React, { useState, useEffect } from 'react';
import { Trophy, History, Users, LogOut, User, Edit2, Check, LayoutDashboard } from 'lucide-react';

const POSITIONS = ['C', 'PF', 'CT', 'SF', 'SG', 'PG', 'SW', 'DG'];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('main');

  const [loginName, setLoginName] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [regMainPos, setRegMainPos] = useState('C');
  const [regSubPos, setRegSubPos] = useState('PF');

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editMainPos, setEditMainPos] = useState('');
  const [editSubPos, setEditSubPos] = useState('');

  useEffect(() => {
    const savedUsers = JSON.parse(localStorage.getItem('freestyle_users')) || [];
    const savedRooms = JSON.parse(localStorage.getItem('freestyle_rooms')) || [];
    const savedCurrentUser = JSON.parse(localStorage.getItem('freestyle_currentUser'));
    setUsers(savedUsers);
    setRooms(savedRooms);
    if (savedCurrentUser) setCurrentUser(savedCurrentUser);
  }, []);

  useEffect(() => {
    localStorage.setItem('freestyle_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('freestyle_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('freestyle_currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('freestyle_currentUser');
    }
  }, [currentUser]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginName || !loginPin) return alert('닉네임과 비밀번호를 입력하라.');

    const existingUser = users.find(u => u.name === loginName);
    if (existingUser) {
      if (existingUser.pin === loginPin || existingUser.pin === '0000') {
        setCurrentUser(existingUser);
        setLoginPin('');
      } else {
        alert('비밀번호가 틀렸다.');
      }
    } else {
      const newUser = {
        name: loginName,
        pin: loginPin,
        mainPosition: regMainPos,
        subPosition: regSubPos,
        wins: 0,
        losses: 0,
        points: 0
      };
      setUsers([...users, newUser]);
      setCurrentUser(newUser);
      setLoginPin('');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('main');
  };

  const resetPin = (userName) => {
    const updatedUsers = users.map(u => u.name === userName ? { ...u, pin: '0000' } : u);
    setUsers(updatedUsers);
    alert(`${userName}의 비밀번호가 '0000'으로 초기화되었다.`);
  };

  const createRoom = () => {
    const newRoom = {
      id: Date.now(),
      name: `내전 #${rooms.length + 1}`,
      host: currentUser.name,
      status: 'recruiting',
      participants: [],
      teams: [],
      matches: [],
      createdAt: new Date().toISOString()
    };
    setRooms([newRoom, ...rooms]);
  };

  const joinRoom = (roomId) => {
    setRooms(rooms.map(room => {
      if (room.id === roomId && !room.participants.includes(currentUser.name)) {
        return { ...room, participants: [...room.participants, currentUser.name] };
      }
      return room;
    }));
  };

  const addTestBots = (roomId) => {
    const bots = Array.from({ length: 8 }, (_, i) => ({
      name: `테스트봇${i + 1}`,
      pin: '0000',
      mainPosition: POSITIONS[Math.floor(Math.random() * POSITIONS.length)],
      subPosition: POSITIONS[Math.floor(Math.random() * POSITIONS.length)],
      wins: 0,
      losses: 0,
      points: 0
    }));

    const newUsers = [...users];
    const botNames = [];
    bots.forEach(bot => {
      if (!newUsers.some(u => u.name === bot.name)) {
        newUsers.push(bot);
      }
      botNames.push(bot.name);
    });
    setUsers(newUsers);

    setRooms(rooms.map(room => {
      if (room.id === roomId) {
        const uniqueParticipants = Array.from(new Set([...room.participants, ...botNames]));
        return { ...room, participants: uniqueParticipants };
      }
      return room;
    }));
  };

  const generateTeams = (roomId) => {
    setRooms(rooms.map(room => {
      if (room.id === roomId) {
        const shuffled = [...room.participants].sort(() => 0.5 - Math.random());
        const teamA = shuffled.slice(0, Math.ceil(shuffled.length / 2));
        const teamB = shuffled.slice(Math.ceil(shuffled.length / 2));
        return { ...room, status: 'teams_ready', teams: [teamA, teamB] };
      }
      return room;
    }));
  };

  const generateTournament = (roomId) => {
    setRooms(rooms.map(room => {
      if (room.id === roomId) {
        const t = room.teams;
        const matches = [];
        let matchId = 1;

        if (t.length >= 2) {
          matches.push({
            id: matchId++,
            round: '결승',
            teamA: t[0],
            teamB: t[1],
            winner: null,
            status: 'pending'
          });
        }
        return { ...room, status: 'playing', matches };
      }
      return room;
    }));
  };

  const updateMatchResult = (roomId, matchId, winner) => {
    setRooms(rooms.map(room => {
      if (room.id === roomId) {
        const updatedMatches = room.matches.map(match => {
          if (match.id === matchId) {
            return { ...match, winner, status: 'completed' };
          }
          return match;
        });
        return { ...room, matches: updatedMatches };
      }
      return room;
    }));
    recalculateRankings(roomId, matchId, winner, false);
  };

  const rollbackMatchResult = (roomId, matchId) => {
    let revertedWinner = null;
    setRooms(rooms.map(room => {
      if (room.id === roomId) {
        const updatedMatches = room.matches.map(match => {
          if (match.id === matchId) {
            revertedWinner = match.winner;
            return { ...match, winner: null, status: 'pending' };
          }
          return match;
        });
        return { ...room, matches: updatedMatches };
      }
      return room;
    }));
    if (revertedWinner) {
      recalculateRankings(roomId, matchId, revertedWinner, true);
    }
  };

  const recalculateRankings = (roomId, matchId, winner, isRollback) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const match = room.matches.find(m => m.id === matchId);
    if (!match) return;

    const winTeam = winner === 'teamA' ? match.teamA : match.teamB;
    const loseTeam = winner === 'teamA' ? match.teamB : match.teamA;

    setUsers(prevUsers => prevUsers.map(user => {
      let u = { ...user };
      if (winTeam.includes(u.name)) {
        u.wins += isRollback ? -1 : 1;
        u.points += isRollback ? -3 : 3;
      } else if (loseTeam.includes(u.name)) {
        u.losses += isRollback ? -1 : 1;
        u.points += isRollback ? -1 : 1;
      }
      return u;
    }));
  };

  const updateProfile = () => {
    const updatedUsers = users.map(u => {
      if (u.name === currentUser.name) {
        return { ...u, mainPosition: editMainPos, subPosition: editSubPos };
      }
      return u;
    });
    setUsers(updatedUsers);
    setCurrentUser({ ...currentUser, mainPosition: editMainPos, subPosition: editSubPos });
    setIsEditingProfile(false);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
          <h1 className="text-3xl font-bold text-white text-center mb-8">프리스타일 리부트 내전</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-2">닉네임</label>
              <input
                type="text"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="닉네임을 입력하라"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">비밀번호 (PIN)</label>
              <input
                type="password"
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value)}
                maxLength={4}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="4자리 숫자"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4 pb-4">
              <div>
                <label className="block text-gray-400 mb-2">주 포지션 (신규)</label>
                <select
                  value={regMainPos}
                  onChange={(e) => setRegMainPos(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-2">부 포지션 (신규)</label>
                <select
                  value={regSubPos}
                  onChange={(e) => setRegSubPos(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
              입장하기
            </button>
            <p className="text-gray-500 text-sm text-center mt-4">최초 입장 시 입력한 비밀번호로 계정이 등록된다.</p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <span className="text-xl font-bold text-white">FS Reboot</span>
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('main')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md ${activeTab === 'main' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                >
                  <LayoutDashboard size={18} /><span>내전 대시보드</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md ${activeTab === 'history' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                >
                  <History size={18} /><span>전체 매치 기록</span>
                </button>
                <button
                  onClick={() => setActiveTab('ranking')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md ${activeTab === 'ranking' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                >
                  <Trophy size={18} /><span>종합 랭킹</span>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md ${activeTab === 'profile' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                >
                  <User size={18} /><span>내 프로필</span>
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300"><span className="font-bold text-indigo-400">{currentUser.name}</span>님</span>
              <button onClick={handleLogout} className="text-gray-400 hover:text-white flex items-center space-x-1">
                <LogOut size={18} /><span>로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 py-8">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">내 프로필</h2>
            {(() => {
              const myInfo = users.find(u => u.name === currentUser.name) || currentUser;
              const totalMatches = myInfo.wins + myInfo.losses;
              const winRate = totalMatches === 0 ? 0 : Math.round((myInfo.wins / totalMatches) * 100);

              const myMatchHistory = rooms.flatMap(room =>
                room.matches
                  .filter(m => m.status === 'completed' && (m.teamA.includes(myInfo.name) || m.teamB.includes(myInfo.name)))
                  .map(m => {
                    const isTeamA = m.teamA.includes(myInfo.name);
                    const isWin = (isTeamA && m.winner === 'teamA') || (!isTeamA && m.winner === 'teamB');
                    return { ...m, isWin, roomName: room.name, roomId: room.id };
                  })
              ).sort((a, b) => b.id - a.id);

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 lg:col-span-1">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold">포지션 설정</h3>
                      {!isEditingProfile ? (
                        <button onClick={() => { setIsEditingProfile(true); setEditMainPos(myInfo.mainPosition || 'C'); setEditSubPos(myInfo.subPosition || 'PF'); }} className="text-indigo-400 hover:text-indigo-300">
                          <Edit2 size={18} />
                        </button>
                      ) : (
                        <button onClick={updateProfile} className="text-green-400 hover:text-green-300">
                          <Check size={22} />
                        </button>
                      )}
                    </div>
                    {isEditingProfile ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">주 포지션</label>
                          <select value={editMainPos} onChange={(e) => setEditMainPos(e.target.value)} className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg">
                            {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">부 포지션</label>
                          <select value={editSubPos} onChange={(e) => setEditSubPos(e.target.value)} className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg">
                            {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-gray-700 p-4 rounded-lg text-center">
                          <div className="text-sm text-gray-400">주 포지션</div>
                          <div className="text-2xl font-bold text-indigo-400">{myInfo.mainPosition || '-'}</div>
                        </div>
                        <div className="bg-gray-700 p-4 rounded-lg text-center">
                          <div className="text-sm text-gray-400">부 포지션</div>
                          <div className="text-2xl font-bold text-blue-400">{myInfo.subPosition || '-'}</div>
                        </div>
                      </div>
                    )}

                    <div className="mt-8">
                      <h3 className="text-xl font-bold mb-4">내 전적 요약</h3>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-gray-700 p-3 rounded-lg">
                          <div className="text-sm text-gray-400">승/패</div>
                          <div className="text-lg font-bold text-white">{myInfo.wins}승 {myInfo.losses}패</div>
                        </div>
                        <div className="bg-gray-700 p-3 rounded-lg">
                          <div className="text-sm text-gray-400">승률</div>
                          <div className="text-lg font-bold text-white">{winRate}%</div>
                        </div>
                        <div className="bg-gray-700 p-3 rounded-lg col-span-2">
                          <div className="text-sm text-gray-400">누적 승점</div>
                          <div className="text-2xl font-bold text-yellow-400">{myInfo.points}점</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 lg:col-span-2">
                    <h3 className="text-xl font-bold mb-6 flex items-center space-x-2">
                      <History size={20} className="text-indigo-400" />
                      <span>최근 참가 매치 기록</span>
                    </h3>
                    <div className="space-y-3">
                      {myMatchHistory.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">참여한 매치 기록이 없다.</div>
                      ) : (
                        myMatchHistory.map((match, idx) => (
                          <div key={idx} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between border-l-4 border-transparent" style={{ borderLeftColor: match.isWin ? '#10B981' : '#EF4444' }}>
                            <div>
                              <div className="text-sm text-gray-400 mb-1">{match.roomName} - {match.round}</div>
                              <div className="flex items-center space-x-3 text-sm">
                                <span className={match.winner === 'teamA' ? 'text-white font-bold' : 'text-gray-400'}>{match.teamA.join(', ')}</span>
                                <span className="text-gray-500">vs</span>
                                <span className={match.winner === 'teamB' ? 'text-white font-bold' : 'text-gray-400'}>{match.teamB.join(', ')}</span>
                              </div>
                            </div>
                            <div className="flex-shrink-0 ml-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-bold ${match.isWin ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                {match.isWin ? '승리' : '패배'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'main' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">진행 중인 내전</h2>
              <button onClick={createRoom} className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-bold transition-colors">
                + 새 내전 개최
              </button>
            </div>
            
            <div className="grid gap-6">
              {rooms.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-gray-800 rounded-xl border border-gray-700">진행 중인 내전이 없다.</div>
              ) : (
                rooms.map(room => (
                  <div key={room.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    <div className="bg-gray-750 p-4 border-b border-gray-700 flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold">{room.name}</h3>
                        <p className="text-sm text-gray-400">방장: {room.host}</p>
                      </div>
                      <div className="flex space-x-2">
                        {room.host === currentUser.name && room.status === 'recruiting' && (
                          <button onClick={() => addTestBots(room.id)} className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm transition-colors">
                            + 테스트봇 8명
                          </button>
                        )}
                        <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">
                          {room.status === 'recruiting' ? '모집 중' : room.status === 'teams_ready' ? '팀 배정 완료' : '진행 중'}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      {room.status === 'recruiting' && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-gray-400 mb-2 flex items-center"><Users size={16} className="mr-2" /> 참가자 ({room.participants.length}명)</h4>
                            <div className="flex flex-wrap gap-2">
                              {room.participants.map(p => (
                                <span key={p} className="bg-gray-700 px-3 py-1 rounded-lg text-sm">{p}</span>
                              ))}
                            </div>
                          </div>
                          {!room.participants.includes(currentUser.name) ? (
                            <button onClick={() => joinRoom(room.id)} className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-lg font-bold transition-colors">
                              참가 신청하기
                            </button>
                          ) : (
                            <div className="w-full bg-green-900/30 text-green-400 py-3 rounded-lg text-center font-bold border border-green-800">
                              참가 신청 완료
                            </div>
                          )}
                          {room.host === currentUser.name && room.participants.length >= 2 && (
                            <button onClick={() => generateTeams(room.id)} className="w-full bg-yellow-600 hover:bg-yellow-700 py-3 rounded-lg font-bold transition-colors">
                              모집 마감 및 팀 생성
                            </button>
                          )}
                        </div>
                      )}

                      {room.status === 'teams_ready' && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="bg-gray-700 p-4 rounded-xl border-t-4 border-indigo-500">
                              <h4 className="font-bold mb-4 text-indigo-400">Team A</h4>
                              <div className="space-y-2">
                                {room.teams[0].map(p => <div key={p}>{p}</div>)}
                              </div>
                            </div>
                            <div className="bg-gray-700 p-4 rounded-xl border-t-4 border-pink-500">
                              <h4 className="font-bold mb-4 text-pink-400">Team B</h4>
                              <div className="space-y-2">
                                {room.teams[1].map(p => <div key={p}>{p}</div>)}
                              </div>
                            </div>
                          </div>
                          {room.host === currentUser.name && (
                            <button onClick={() => generateTournament(room.id)} className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-lg font-bold transition-colors">
                              매치 생성하기
                            </button>
                          )}
                        </div>
                      )}

                      {room.status === 'playing' && (
                        <div className="space-y-4">
                          {room.matches.map(match => (
                            <div key={match.id} className="bg-gray-700 p-4 rounded-lg flex items-center justify-between">
                              <div className="flex-1">
                                <span className="text-sm text-gray-400 block mb-2">{match.round}</span>
                                <div className="flex items-center space-x-4">
                                  <span className={`font-bold ${match.winner === 'teamA' ? 'text-green-400' : ''}`}>{match.teamA.join(', ')}</span>
                                  <span className="text-gray-500 text-sm">vs</span>
                                  <span className={`font-bold ${match.winner === 'teamB' ? 'text-green-400' : ''}`}>{match.teamB.join(', ')}</span>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                {match.status === 'pending' ? (
                                  (room.host === currentUser.name || match.teamA.includes(currentUser.name) || match.teamB.includes(currentUser.name)) && (
                                    <>
                                      <button onClick={() => updateMatchResult(room.id, match.id, 'teamA')} className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded text-sm">A팀 승</button>
                                      <button onClick={() => updateMatchResult(room.id, match.id, 'teamB')} className="bg-pink-600 hover:bg-pink-500 px-3 py-1 rounded text-sm">B팀 승</button>
                                    </>
                                  )
                                ) : (
                                  <>
                                    <span className="px-3 py-1 bg-gray-800 rounded text-sm text-gray-300 border border-gray-600">결과 완료</span>
                                    {room.host === currentUser.name && (
                                      <button onClick={() => rollbackMatchResult(room.id, match.id)} className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm">결과 수정</button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">전체 매치 기록</h2>
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-750 text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="p-4">내전 이름</th>
                    <th className="p-4">승리 팀</th>
                    <th className="p-4">패배 팀</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {rooms.flatMap(room => 
                    room.matches.filter(m => m.status === 'completed').map(match => (
                      <tr key={`${room.id}-${match.id}`} className="hover:bg-gray-750">
                        <td className="p-4">{room.name}</td>
                        <td className="p-4 text-green-400 font-bold">{match.winner === 'teamA' ? match.teamA.join(', ') : match.teamB.join(', ')}</td>
                        <td className="p-4 text-gray-500">{match.winner === 'teamA' ? match.teamB.join(', ') : match.teamA.join(', ')}</td>
                      </tr>
                    ))
                  ).reverse()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">종합 랭킹</h2>
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-750 text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="p-4 w-16">순위</th>
                    <th className="p-4">닉네임</th>
                    <th className="p-4">주/부 포지션</th>
                    <th className="p-4">승점</th>
                    <th className="p-4">전적</th>
                    <th className="p-4 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {[...users].sort((a, b) => b.points - a.points).map((user, idx) => (
                    <tr key={user.name} className="hover:bg-gray-750">
                      <td className="p-4 font-bold text-gray-400">{idx + 1}</td>
                      <td className="p-4 font-bold">{user.name}</td>
                      <td className="p-4 text-sm text-indigo-300">{user.mainPosition || '-'}/{user.subPosition || '-'}</td>
                      <td className="p-4 text-yellow-400 font-bold">{user.points}점</td>
                      <td className="p-4 text-gray-400">{user.wins}승 {user.losses}패</td>
                      <td className="p-4 text-right">
                        {user.name !== currentUser.name && (
                          <button onClick={() => resetPin(user.name)} className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors">
                            초기화
                          </button>
                        )}
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