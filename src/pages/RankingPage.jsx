export default function RankingPage({ users, currentUser, resetPin }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">종합 랭킹</h2>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-750 text-gray-400 border-b border-gray-700">
            <tr><th className="p-4 w-16">순위</th><th className="p-4">닉네임</th><th className="p-4">주/부 포지션</th><th className="p-4">승점</th><th className="p-4">전적</th><th className="p-4 text-right">관리</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {[...users].sort((a, b) => b.points - a.points).map((user, index) => (
              <tr key={user.name} className="hover:bg-gray-750">
                <td className="p-4 font-bold text-gray-400">{index + 1}</td>
                <td className="p-4 font-bold">{user.name}</td>
                <td className="p-4 text-sm text-indigo-300">{user.mainPosition || '-'}/{user.subPosition || '-'}</td>
                <td className="p-4 text-yellow-400 font-bold">{user.points}점</td>
                <td className="p-4 text-gray-400">{user.wins}승 {user.losses}패</td>
                <td className="p-4 text-right">
                  {user.name !== currentUser.name && <button onClick={() => resetPin(user.name)} className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors">초기화</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
