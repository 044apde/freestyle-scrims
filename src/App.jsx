import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase'; // firebase.js에서 db를 불러옴
import AuthPage from './components/AuthPage';
import Navigation from './components/Navigation';
import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';
import RankingPage from './pages/RankingPage';

const POSITIONS = ['C', 'PF', 'CT', 'SF', 'SG', 'PG', 'SW', 'DG'];
const INVITATION_CODE = '스포스프';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('main');
  const [authMode, setAuthMode] = useState('login');

  const [loginName, setLoginName] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPin, setSignupPin] = useState('');
  const [signupPinConfirm, setSignupPinConfirm] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [regMainPos, setRegMainPos] = useState('C');
  const [regSubPos, setRegSubPos] = useState('PF');

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editMainPos, setEditMainPos] = useState('');
  const [editSubPos, setEditSubPos] = useState('');

  // 실시간 파이어베이스 데이터 동기화
  useEffect(() => {
    const savedCurrentUser = JSON.parse(localStorage.getItem('freestyle_currentUser'));
    if (savedCurrentUser) setCurrentUser(savedCurrentUser);

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data());
      setUsers(usersData);
    });

    const unsubRooms = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      const roomsData = snapshot.docs.map(doc => doc.data()).sort((a, b) => b.id - a.id);
      setRooms(roomsData);
    });

    return () => {
      unsubUsers();
      unsubRooms();
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('freestyle_currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('freestyle_currentUser');
    }
  }, [currentUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginName || !loginPin) return alert('닉네임과 비밀번호를 입력하세요.');

    const existingUser = users.find(u => u.name === loginName);
    if (!existingUser) {
      return alert('가입된 계정을 찾을 수 없습니다. 먼저 회원가입을 진행하세요.');
    }

    if (existingUser.pin === loginPin || existingUser.pin === '0000') {
      setCurrentUser(existingUser);
      setLoginPin('');
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!signupName || !signupPin || !signupPinConfirm || !invitationCode) {
      return alert('회원가입 정보를 모두 입력하세요.');
    }
    if (invitationCode !== INVITATION_CODE) {
      return alert('계정 생성 코드가 올바르지 않습니다.');
    }
    if (signupPin !== signupPinConfirm) {
      return alert('비밀번호가 일치하지 않습니다.');
    }
    if (users.some(user => user.name === signupName)) {
      return alert('이미 사용 중인 닉네임입니다.');
    }

    const newUser = {
      name: signupName,
      pin: signupPin,
      mainPosition: regMainPos,
      subPosition: regSubPos,
      wins: 0,
      losses: 0,
      points: 0
    };
    try {
      await setDoc(doc(db, 'users', signupName), newUser);
      setUsers(prevUsers => [...prevUsers, newUser]);
      setCurrentUser(newUser);
      setSignupName('');
      setSignupPin('');
      setSignupPinConfirm('');
      setInvitationCode('');
    } catch (error) {
      console.error('회원가입 저장 실패:', error);
      alert('회원가입에 실패했습니다. 잠시 후 다시 시도하세요.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('main');
  };

  const resetPin = async (userName) => {
    const targetUser = users.find(u => u.name === userName);
    if(targetUser) {
      await setDoc(doc(db, 'users', userName), { ...targetUser, pin: '0000' });
      alert(`${userName}의 비밀번호가 '0000'으로 초기화되었다.`);
    }
  };

  const createRoom = async () => {
    const roomId = Date.now();
    const newRoom = {
      id: roomId,
      name: `내전 #${rooms.length + 1}`,
      host: currentUser.name,
      status: 'recruiting',
      participants: [],
      teams: [],
      matches: [],
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'rooms', roomId.toString()), newRoom);
  };

  const joinRoom = async (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (room && !room.participants.includes(currentUser.name)) {
      await setDoc(doc(db, 'rooms', roomId.toString()), {
        ...room,
        participants: [...room.participants, currentUser.name]
      });
    }
  };

  const addTestBots = async (roomId) => {
    const bots = Array.from({ length: 8 }, (_, i) => ({
      name: `테스트봇${i + 1}`,
      pin: '0000',
      mainPosition: POSITIONS[Math.floor(Math.random() * POSITIONS.length)],
      subPosition: POSITIONS[Math.floor(Math.random() * POSITIONS.length)],
      wins: 0,
      losses: 0,
      points: 0
    }));

    const botNames = [];
    for (const bot of bots) {
      if (!users.some(u => u.name === bot.name)) {
        await setDoc(doc(db, 'users', bot.name), bot);
      }
      botNames.push(bot.name);
    }

    const room = rooms.find(r => r.id === roomId);
    if (room) {
      const uniqueParticipants = Array.from(new Set([...room.participants, ...botNames]));
      await setDoc(doc(db, 'rooms', roomId.toString()), {
        ...room,
        participants: uniqueParticipants
      });
    }
  };

  const generateTeams = async (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      const shuffled = [...room.participants].sort(() => 0.5 - Math.random());
      const teamA = shuffled.slice(0, Math.ceil(shuffled.length / 2));
      const teamB = shuffled.slice(Math.ceil(shuffled.length / 2));
      await setDoc(doc(db, 'rooms', roomId.toString()), {
        ...room,
        status: 'teams_ready',
        teams: [teamA, teamB]
      });
    }
  };

  const generateTournament = async (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      const t = room.teams;
      const matches = [];
      if (t.length >= 2) {
        matches.push({
          id: 1,
          round: '결승',
          teamA: t[0],
          teamB: t[1],
          winner: null,
          status: 'pending'
        });
      }
      await setDoc(doc(db, 'rooms', roomId.toString()), {
        ...room,
        status: 'playing',
        matches
      });
    }
  };

  const updateMatchResult = async (roomId, matchId, winner) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const updatedMatches = room.matches.map(match => {
      if (match.id === matchId) return { ...match, winner, status: 'completed' };
      return match;
    });

    await setDoc(doc(db, 'rooms', roomId.toString()), { ...room, matches: updatedMatches });
    await recalculateRankings(roomId, matchId, winner, false, room);
  };

  const rollbackMatchResult = async (roomId, matchId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    let revertedWinner = null;
    const updatedMatches = room.matches.map(match => {
      if (match.id === matchId) {
        revertedWinner = match.winner;
        return { ...match, winner: null, status: 'pending' };
      }
      return match;
    });

    await setDoc(doc(db, 'rooms', roomId.toString()), { ...room, matches: updatedMatches });
    if (revertedWinner) {
      await recalculateRankings(roomId, matchId, revertedWinner, true, room);
    }
  };

  const recalculateRankings = async (roomId, matchId, winner, isRollback, roomState) => {
    const match = roomState.matches.find(m => m.id === matchId);
    if (!match) return;

    const winTeam = winner === 'teamA' ? match.teamA : match.teamB;
    const loseTeam = winner === 'teamA' ? match.teamB : match.teamA;

    for (const userName of [...winTeam, ...loseTeam]) {
      const user = users.find(u => u.name === userName);
      if (user) {
        let u = { ...user };
        if (winTeam.includes(u.name)) {
          u.wins += isRollback ? -1 : 1;
          u.points += isRollback ? -3 : 3;
        } else {
          u.losses += isRollback ? -1 : 1;
          u.points += isRollback ? -1 : 1;
        }
        await setDoc(doc(db, 'users', userName), u);
      }
    }
  };

  const updateProfile = async () => {
    const myInfo = users.find(u => u.name === currentUser.name);
    if (myInfo) {
      const updatedInfo = { ...myInfo, mainPosition: editMainPos, subPosition: editSubPos };
      await setDoc(doc(db, 'users', currentUser.name), updatedInfo);
      setCurrentUser({ ...currentUser, mainPosition: editMainPos, subPosition: editSubPos });
      setIsEditingProfile(false);
    }
  };

  if (!currentUser) {
    return <AuthPage
      authMode={authMode}
      setAuthMode={setAuthMode}
      loginName={loginName}
      setLoginName={setLoginName}
      loginPin={loginPin}
      setLoginPin={setLoginPin}
      signupName={signupName}
      setSignupName={setSignupName}
      signupPin={signupPin}
      setSignupPin={setSignupPin}
      signupPinConfirm={signupPinConfirm}
      setSignupPinConfirm={setSignupPinConfirm}
      invitationCode={invitationCode}
      setInvitationCode={setInvitationCode}
      regMainPos={regMainPos}
      setRegMainPos={setRegMainPos}
      regSubPos={regSubPos}
      setRegSubPos={setRegSubPos}
      handleLogin={handleLogin}
      handleSignup={handleSignup}
    />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} handleLogout={handleLogout} />

      <main className="max-w-6xl mx-auto p-4 py-8">
        {activeTab === 'profile' && <ProfilePage
          currentUser={currentUser}
          users={users}
          rooms={rooms}
          isEditingProfile={isEditingProfile}
          setIsEditingProfile={setIsEditingProfile}
          editMainPos={editMainPos}
          setEditMainPos={setEditMainPos}
          editSubPos={editSubPos}
          setEditSubPos={setEditSubPos}
          updateProfile={updateProfile}
        />}

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

        {activeTab === 'history' && <HistoryPage rooms={rooms} />}

        {activeTab === 'ranking' && <RankingPage users={users} currentUser={currentUser} resetPin={resetPin} />}
      </main>
    </div>
  );
}