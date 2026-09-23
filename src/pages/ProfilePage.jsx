import { Check, Edit2, History } from 'lucide-react';
import PositionBadge from '../components/PositionBadge';

const POSITIONS = ['C', 'PF', 'CT', 'SF', 'SG', 'PG', 'SW', 'DG'];

export default function ProfilePage({
  currentUser,
  users,
  rooms,
  isEditingProfile,
  setIsEditingProfile,
  editMainPos,
  setEditMainPos,
  editSubPos,
  setEditSubPos,
  updateProfile
}) {
  const myInfo = users.find(user => user.name === currentUser.name) || currentUser;
  const totalMatches = myInfo.wins + myInfo.losses;
  const winRate = totalMatches === 0 ? 0 : Math.round((myInfo.wins / totalMatches) * 100);
  const myMatchHistory = rooms.flatMap(room =>
    room.matches
      .filter(match => match.status === 'completed' && (match.teamA.includes(myInfo.name) || match.teamB.includes(myInfo.name)))
      .map(match => {
        const isTeamA = match.teamA.includes(myInfo.name);
        const isWin = (isTeamA && match.winner === 'teamA') || (!isTeamA && match.winner === 'teamB');
        return { ...match, isWin, roomName: room.name };
      })
  ).sort((a, b) => b.id - a.id);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">내 프로필</h2>
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
                <select value={editMainPos} onChange={(e) => setEditMainPos(e.target.value)} className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg">{POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}</select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">부 포지션</label>
                <select value={editSubPos} onChange={(e) => setEditSubPos(e.target.value)} className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg">{POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}</select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-700 p-4 rounded-lg text-center"><div className="text-sm text-gray-400 mb-2">주 포지션</div><PositionBadge position={myInfo.mainPosition} /></div>
              <div className="bg-gray-700 p-4 rounded-lg text-center"><div className="text-sm text-gray-400 mb-2">부 포지션</div><PositionBadge position={myInfo.subPosition} /></div>
            </div>
          )}
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">내 전적 요약</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-700 p-3 rounded-lg"><div className="text-sm text-gray-400">승/패</div><div className="text-lg font-bold text-white">{myInfo.wins}승 {myInfo.losses}패</div></div>
              <div className="bg-gray-700 p-3 rounded-lg"><div className="text-sm text-gray-400">승률</div><div className="text-lg font-bold text-white">{winRate}%</div></div>
              <div className="bg-gray-700 p-3 rounded-lg col-span-2"><div className="text-sm text-gray-400">누적 승점</div><div className="text-2xl font-bold text-yellow-400">{myInfo.points}점</div></div>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 lg:col-span-2">
          <h3 className="text-xl font-bold mb-6 flex items-center space-x-2"><History size={20} className="text-indigo-400" /><span>최근 참가 매치 기록</span></h3>
          <div className="space-y-3">
            {myMatchHistory.length === 0 ? <div className="text-center py-10 text-gray-500">참여한 매치 기록이 없습니다.</div> : myMatchHistory.map((match, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between border-l-4 border-transparent" style={{ borderLeftColor: match.isWin ? '#10B981' : '#EF4444' }}>
                <div><div className="text-sm text-gray-400 mb-1">{match.roomName} - {match.round}</div><div className="flex items-center space-x-3 text-sm"><span className={match.winner === 'teamA' ? 'text-white font-bold' : 'text-gray-400'}>{match.teamA.join(', ')}</span><span className="text-gray-500">vs</span><span className={match.winner === 'teamB' ? 'text-white font-bold' : 'text-gray-400'}>{match.teamB.join(', ')}</span></div></div>
                <span className={`flex-shrink-0 ml-4 px-3 py-1 rounded-full text-sm font-bold ${match.isWin ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{match.isWin ? '승리' : '패배'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
