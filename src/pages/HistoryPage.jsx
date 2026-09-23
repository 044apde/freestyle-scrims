export default function HistoryPage({ rooms }) {
  const matches = rooms.flatMap(room =>
    room.matches.filter(match => match.status === 'completed').map(match => ({ room, match }))
  ).reverse();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">전체 매치 기록</h2>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-750 text-gray-400 border-b border-gray-700">
            <tr><th className="p-4">내전 이름</th><th className="p-4">승리 팀</th><th className="p-4">패배 팀</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {matches.map(({ room, match }) => (
              <tr key={`${room.id}-${match.id}`} className="hover:bg-gray-750">
                <td className="p-4">{room.name}</td>
                <td className="p-4 text-green-400 font-bold">{match.winner === 'teamA' ? match.teamA.join(', ') : match.teamB.join(', ')}</td>
                <td className="p-4 text-gray-500">{match.winner === 'teamA' ? match.teamB.join(', ') : match.teamA.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
