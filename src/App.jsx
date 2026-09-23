import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, History, Users, LogOut, User, Edit2, Check, LayoutDashboard, UserPlus, Trash2 } from 'lucide-react';
import positionBanner from './assets/position-banner.png';

const POSITIONS = ['C', 'PF', 'SF', 'SG', 'PG'];
const INVITATION_CODE = '다시만난세계';
const ADMIN_ACCOUNT = {
  name: 'root',
  pin: '044apde',
  isAdmin: true,
  mainPosition: 'C',
  subPosition: 'PF',
  wins: 0,
  losses: 0,
  points: 0
};

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
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [editingAccountName, setEditingAccountName] = useState(null);
  const [accountForm, setAccountForm] = useState({
    name: '',
    pin: '',
    mainPosition: 'C',
    subPosition: 'PF',
    wins: 0,
    losses: 0,
    points: 0,
    isAdmin: false
  });

  useEffect(() => {
    const savedUsers = JSON.parse(localStorage.getItem('freestyle_users')) || [];
    const savedRooms = JSON.parse(localStorage.getItem('freestyle_rooms')) || [];
    const savedCurrentUser = JSON.parse(localStorage.getItem('freestyle_currentUser'));
    const usersWithAdmin = savedUsers.some(user => user.name === ADMIN_ACCOUNT.name)
      ? savedUsers.map(user => user.name === ADMIN_ACCOUNT.name ? { ...user, ...ADMIN_ACCOUNT } : user)
      : [ADMIN_ACCOUNT, ...savedUsers];
    const restoredUser = savedCurrentUser
      ? usersWithAdmin.find(user => user.name === savedCurrentUser.name)
      : null;
    setUsers(usersWithAdmin);
    setRooms(savedRooms);
    if (restoredUser) setCurrentUser(restoredUser);
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
    if (!loginName || !loginPin) return alert('닉네임과 비밀번호를 입력하세요.');

    const existingUser = users.find(u => u.name === loginName);
    if (!existingUser) {
      alert('가입된 계정을 찾을 수 없습니다. 먼저 회원가입을 진행하세요.');
      return;
    }

    if (existingUser.pin === loginPin || existingUser.pin === '0000') {
      setCurrentUser(existingUser);
      setLoginPin('');
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const handleSignup = (e) => {
    e.preventDefault();
    if (!signupName || !signupPin || !signupPinConfirm || !invitationCode) {
      return alert('회원가입 정보를 모두 입력하세요.');
    }
    if (invitationCode !== INVITATION_CODE) {
      return alert('회원가입 코드가 올바르지 않습니다.');
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
      isAdmin: false,
      mainPosition: regMainPos,
      subPosition: regSubPos,
      wins: 0,
      losses: 0,
      points: 0
    };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setSignupName('');
    setSignupPin('');
    setSignupPinConfirm('');
    setInvitationCode('');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('main');
  };

  const openAccountForm = (user = null) => {
    if (!isAccountFormOpen) {
      window.history.pushState({ accountForm: true }, '', window.location.href);
    }
    setIsAccountFormOpen(true);
    if (user) {
      setEditingAccountName(user.name);
      setAccountForm({
        name: user.name,
        pin: user.pin,
        mainPosition: user.mainPosition || 'C',
        subPosition: user.subPosition || 'PF',
        wins: user.wins || 0,
        losses: user.losses || 0,
        points: user.points || 0,
        isAdmin: Boolean(user.isAdmin)
      });
    } else {
      setEditingAccountName(null);
      setAccountForm({
        name: '',
        pin: '',
        mainPosition: 'C',
        subPosition: 'PF',
        wins: 0,
        losses: 0,
        points: 0,
        isAdmin: false
      });
    }
  };

  const closeAccountForm = useCallback(({ fromHistory = false } = {}) => {
    if (!fromHistory && isAccountFormOpen && window.history.state?.accountForm) {
      window.history.back();
      return;
    }
    setIsAccountFormOpen(false);
    setEditingAccountName(null);
    setAccountForm({
      name: '',
      pin: '',
      mainPosition: 'C',
      subPosition: 'PF',
      wins: 0,
      losses: 0,
      points: 0,
      isAdmin: false
    });
  }, [isAccountFormOpen]);

  useEffect(() => {
    const handleBrowserBack = () => {
      if (isAccountFormOpen) {
        closeAccountForm({ fromHistory: true });
      }
    };

    window.addEventListener('popstate', handleBrowserBack);
    return () => window.removeEventListener('popstate', handleBrowserBack);
  }, [isAccountFormOpen, closeAccountForm]);

  const handleAccountFormChange = (field, value) => {
    setAccountForm(prev => ({ ...prev, [field]: value }));
  };

  const saveAccount = (e) => {
    e.preventDefault();
    if (!currentUser?.isAdmin) return;

    const name = accountForm.name.trim();
    if (!name || !accountForm.pin) {
      return alert('닉네임과 비밀번호를 입력하세요.');
    }
    if (name === 'root' && (!accountForm.isAdmin || editingAccountName !== 'root')) {
      return alert('root 계정은 관리자 권한과 닉네임을 변경할 수 없습니다.');
    }
    if (users.some(user => user.name === name && user.name !== editingAccountName)) {
      return alert('이미 사용 중인 닉네임입니다.');
    }

    const account = {
      name,
      pin: accountForm.pin,
      isAdmin: Boolean(accountForm.isAdmin),
      mainPosition: accountForm.mainPosition,
      subPosition: accountForm.subPosition,
      wins: Number(accountForm.wins) || 0,
      losses: Number(accountForm.losses) || 0,
      points: Number(accountForm.points) || 0
    };

    if (!editingAccountName) {
      setUsers(prevUsers => [...prevUsers, account]);
      closeAccountForm();
      return;
    }

    setUsers(prevUsers => prevUsers.map(user => user.name === editingAccountName ? account : user));
    if (editingAccountName === currentUser.name || name === currentUser.name) {
      setCurrentUser(account);
    }

    if (editingAccountName !== name) {
      setRooms(prevRooms => prevRooms.map(room => ({
        ...room,
        host: room.host === editingAccountName ? name : room.host,
        participants: room.participants.map(participant => participant === editingAccountName ? name : participant),
        teams: room.teams.map(team => team.map(participant => participant === editingAccountName ? name : participant)),
        matches: room.matches.map(match => ({
          ...match,
          teamA: match.teamA.map(participant => participant === editingAccountName ? name : participant),
          teamB: match.teamB.map(participant => participant === editingAccountName ? name : participant)
        }))
      })));
    }
    closeAccountForm();
  };

  const deleteAccount = (userName) => {
    if (!currentUser?.isAdmin || userName === 'root') return;
    if (!window.confirm(`${userName} 계정을 삭제하시겠습니까?`)) return;

    setUsers(prevUsers => prevUsers.filter(user => user.name !== userName));
    setRooms(prevRooms => prevRooms.map(room => ({
      ...room,
      host: room.host === userName ? '' : room.host,
      participants: room.participants.filter(participant => participant !== userName),
      teams: room.teams.map(team => team.filter(participant => participant !== userName)),
      matches: room.matches.map(match => ({
        ...match,
        teamA: match.teamA.filter(participant => participant !== userName),
        teamB: match.teamB.filter(participant => participant !== userName)
      }))
    })));
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
          <img src={positionBanner} alt="프리스타일 포지션 배너" className="w-full rounded-lg object-cover mb-6" />
          <h1 className="text-3xl font-bold text-white text-center mb-8">클럽 라운지</h1>
          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">닉네임</label>
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="닉네임을 입력하세요."
                  required
                />
              </div>
              <div>
                  <label className="block text-gray-400 mb-2">비밀번호</label>
                <input
                  type="password"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  maxLength={32}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="비밀번호를 입력하세요."
                  required
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                로그인
              </button>
              <div className="border-t border-gray-700 pt-4 text-center">
                <p className="text-gray-400 text-sm mb-2">계정이 없으신가요?</p>
                <button type="button" onClick={() => setAuthMode('signup')} className="text-indigo-400 hover:text-indigo-300 font-bold">
                  회원가입
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">닉네임</label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="닉네임을 입력하세요."
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">비밀번호</label>
                <input
                  type="password"
                  value={signupPin}
                  onChange={(e) => setSignupPin(e.target.value)}
                  maxLength={32}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="비밀번호를 입력하세요."
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">비밀번호 확인</label>
                <input
                  type="password"
                  value={signupPinConfirm}
                  onChange={(e) => setSignupPinConfirm(e.target.value)}
                  maxLength={32}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="비밀번호를 다시 입력하세요."
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">회원가입 코드</label>
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="회원가입 코드를 입력하세요."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2">주 포지션</label>
                  <select
                    value={regMainPos}
                    onChange={(e) => setRegMainPos(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">부 포지션</label>
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
                회원가입
              </button>
              <div className="border-t border-gray-700 pt-4 text-center">
                <button type="button" onClick={() => setAuthMode('login')} className="text-indigo-400 hover:text-indigo-300 font-bold">
                  로그인으로 돌아가기
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-900 text-gray-100">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="mx-auto max-w-6xl overflow-hidden px-4">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
            <span className="shrink-0 text-xl font-bold text-white">FS Reboot</span>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 max-md:order-3 max-md:basis-full">
              <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setActiveTab('main')}
                  className={`flex shrink-0 items-center space-x-2 whitespace-nowrap rounded-md px-3 py-2 ${activeTab === 'main' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                >
                  <LayoutDashboard size={18} /><span>내전 대시보드</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex shrink-0 items-center space-x-2 whitespace-nowrap rounded-md px-3 py-2 ${activeTab === 'history' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                >
                  <History size={18} /><span>전체 매치 기록</span>
                </button>
                <button
                  onClick={() => setActiveTab('ranking')}
                  className={`flex shrink-0 items-center space-x-2 whitespace-nowrap rounded-md px-3 py-2 ${activeTab === 'ranking' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                >
                  <Trophy size={18} /><span>종합 랭킹</span>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex shrink-0 items-center space-x-2 whitespace-nowrap rounded-md px-3 py-2 ${activeTab === 'profile' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                >
                  <User size={18} /><span>내 프로필</span>
                </button>
                {currentUser.isAdmin && (
                  <button
                    onClick={() => setActiveTab('accounts')}
                    className={`flex shrink-0 items-center space-x-2 whitespace-nowrap rounded-md px-3 py-2 ${activeTab === 'accounts' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                  >
                    <Users size={18} /><span>계정 관리</span>
                  </button>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center space-x-3">
              <span className="text-gray-300"><span className="font-bold text-indigo-400">{currentUser.name}</span>님</span>
              <button onClick={handleLogout} className="flex shrink-0 items-center space-x-1 whitespace-nowrap text-gray-400 hover:text-white">
                <LogOut size={18} /><span>로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto min-w-0 max-w-6xl p-4 py-8">
        {activeTab === 'accounts' && currentUser.isAdmin && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">계정 관리</h2>
                <p className="text-sm text-gray-400 mt-1">전체 {users.filter(user => user.name !== 'root').length}개 계정을 관리합니다.</p>
              </div>
              <button onClick={() => openAccountForm()} className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-bold transition-colors flex items-center space-x-2">
                <UserPlus size={18} /><span>계정 추가</span>
              </button>
            </div>

            {isAccountFormOpen && (
              <form onSubmit={saveAccount} className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">{editingAccountName ? '계정 정보 수정' : '새 계정 추가'}</h3>
                  <button type="button" onClick={closeAccountForm} className="text-gray-400 hover:text-white">취소</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">닉네임</label>
                    <input
                      type="text"
                      value={accountForm.name}
                      onChange={(e) => handleAccountFormChange('name', e.target.value)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">비밀번호</label>
                    <input
                      type="text"
                      value={accountForm.pin}
                      onChange={(e) => handleAccountFormChange('pin', e.target.value)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">주 포지션</label>
                    <select value={accountForm.mainPosition} onChange={(e) => handleAccountFormChange('mainPosition', e.target.value)} className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg">
                      {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">부 포지션</label>
                    <select value={accountForm.subPosition} onChange={(e) => handleAccountFormChange('subPosition', e.target.value)} className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg">
                      {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">승리</label>
                    <input type="number" min="0" value={accountForm.wins} onChange={(e) => handleAccountFormChange('wins', e.target.value)} className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">패배</label>
                    <input type="number" min="0" value={accountForm.losses} onChange={(e) => handleAccountFormChange('losses', e.target.value)} className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">승점</label>
                    <input type="number" value={accountForm.points} onChange={(e) => handleAccountFormChange('points', e.target.value)} className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg" />
                  </div>
                  <label className="flex items-center space-x-2 text-sm text-gray-300 mt-6">
                    <input type="checkbox" checked={accountForm.isAdmin} onChange={(e) => handleAccountFormChange('isAdmin', e.target.checked)} />
                    <span>관리자 권한</span>
                  </label>
                </div>
                <div className="flex space-x-3">
                  <button type="submit" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-bold">저장</button>
                  <button type="button" onClick={closeAccountForm} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg font-bold">취소</button>
                </div>
              </form>
            )}

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-x-auto">
              <table className="w-full text-left min-w-[760px]">
                <thead className="bg-gray-750 text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="p-4">닉네임</th>
                    <th className="p-4">권한</th>
                    <th className="p-4">포지션</th>
                    <th className="p-4">전적</th>
                    <th className="p-4">승점</th>
                    <th className="p-4 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {users.filter(user => user.name !== 'root').map(user => (
                    <tr key={user.name} className="hover:bg-gray-750">
                      <td className="p-4 font-bold">{user.name}</td>
                      <td className="p-4 text-sm">{user.isAdmin ? <span className="text-yellow-400">관리자</span> : '일반 사용자'}</td>
                      <td className="p-4 text-sm text-indigo-300">{user.mainPosition || '-'}/{user.subPosition || '-'}</td>
                      <td className="p-4 text-gray-400">{user.wins}승 {user.losses}패</td>
                      <td className="p-4 text-yellow-400 font-bold">{user.points}점</td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => openAccountForm(user)} className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors">수정</button>
                        {user.name !== 'root' && (
                          <button onClick={() => deleteAccount(user.name)} className="text-sm bg-red-700 hover:bg-red-600 px-3 py-1 rounded transition-colors inline-flex items-center space-x-1">
                            <Trash2 size={14} /><span>삭제</span>
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
                        <div className="text-center py-10 text-gray-500">참여한 매치 기록이 없습니다.</div>
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
                <div className="text-center py-20 text-gray-500 bg-gray-800 rounded-xl border border-gray-700">진행 중인 내전이 없습니다.</div>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {users.filter(user => user.name !== 'root').sort((a, b) => b.points - a.points).map((user, idx) => (
                    <tr key={user.name} className="hover:bg-gray-750">
                      <td className="p-4 font-bold text-gray-400">{idx + 1}</td>
                      <td className="p-4 font-bold">{user.name}</td>
                      <td className="p-4 text-sm text-indigo-300">{user.mainPosition || '-'}/{user.subPosition || '-'}</td>
                      <td className="p-4 text-yellow-400 font-bold">{user.points}점</td>
                      <td className="p-4 text-gray-400">{user.wins}승 {user.losses}패</td>
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