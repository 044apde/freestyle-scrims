const POSITION_STYLES = {
  C: 'bg-red-600 text-white',
  PG: 'bg-green-600 text-white',
  SG: 'bg-yellow-400 text-gray-900',
  SF: 'bg-blue-600 text-white',
  PF: 'bg-purple-600 text-white'
};

export default function PositionBadge({ position }) {
  if (!position || position === '-') {
    return <span className="text-gray-400">-</span>;
  }

  return (
    <span className={`inline-flex min-w-10 justify-center rounded-full px-2 py-1 text-sm font-bold ${POSITION_STYLES[position] || 'bg-gray-600 text-white'}`}>
      {position}
    </span>
  );
}
