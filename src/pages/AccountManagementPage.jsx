import { useState } from 'react';
import PositionBadge from '../components/PositionBadge';

const POSITIONS = ['C', 'PF', 'CT', 'SF', 'SG', 'PG', 'SW', 'DG'];

export default function AccountManagementPage({ users, updateMember, deleteMember }) {
  const members = users.filter(user => user.name !== 'root');
  const [editingName, setEditingName] = useState(null);
  const [form, setForm] = useState(null);

  const startEditing = (member) => {
    setEditingName(member.name);
    setForm({
      name: member.name,
      pin: member.pin || '',
      mainPosition: member.mainPosition || 'C',
      subPosition: member.subPosition || 'PF',
      wins: member.wins || 0,
      losses: member.losses || 0,
      points: member.points || 0
    });
  };

  const cancelEditing = () => {
    setEditingName(null);
    setForm(null);
  };

  const saveEditing = async (event) => {
    event.preventDefault();
    await updateMember(editingName, {
      ...form,
      wins: Number(form.wins) || 0,
      losses: Number(form.losses) || 0,
      points: Number(form.points) || 0
    });
    cancelEditing();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">계정 관리</h2>
        <p className="text-sm text-gray-400 mt-1">일반 멤버 {members.length}명의 정보를 관리합니다.</p>
      </div>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-x-auto">
        <table className="w-full min-w-[780px] text-left">
          <thead className="bg-gray-750 text-gray-400 border-b border-gray-700">
            <tr>
              <th className="p-4">닉네임</th><th className="p-4">비밀번호</th><th className="p-4">주 포지션</th><th className="p-4">부 포지션</th><th className="p-4">승</th><th className="p-4">패</th><th className="p-4">승점</th><th className="p-4 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {members.map(member => editingName === member.name ? (
              <tr key={member.name} className="bg-gray-750">
                <td colSpan="8" className="p-4">
                  <form onSubmit={saveEditing} className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                    <label className="text-sm text-gray-400">닉네임<input value={form.name} disabled className="mt-1 w-full bg-gray-700 text-gray-400 px-3 py-2 rounded-lg" /></label>
                    <label className="text-sm text-gray-400">비밀번호<input value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} className="mt-1 w-full bg-gray-700 text-white px-3 py-2 rounded-lg" required /></label>
                    <label className="text-sm text-gray-400">주 포지션<select value={form.mainPosition} onChange={(e) => setForm({ ...form, mainPosition: e.target.value })} className="mt-1 w-full bg-gray-700 text-white px-3 py-2 rounded-lg">{POSITIONS.map(position => <option key={position}>{position}</option>)}</select></label>
                    <label className="text-sm text-gray-400">부 포지션<select value={form.subPosition} onChange={(e) => setForm({ ...form, subPosition: e.target.value })} className="mt-1 w-full bg-gray-700 text-white px-3 py-2 rounded-lg">{POSITIONS.map(position => <option key={position}>{position}</option>)}</select></label>
                    <label className="text-sm text-gray-400">승<input type="number" min="0" value={form.wins} onChange={(e) => setForm({ ...form, wins: e.target.value })} className="mt-1 w-full bg-gray-700 text-white px-3 py-2 rounded-lg" /></label>
                    <label className="text-sm text-gray-400">패<input type="number" min="0" value={form.losses} onChange={(e) => setForm({ ...form, losses: e.target.value })} className="mt-1 w-full bg-gray-700 text-white px-3 py-2 rounded-lg" /></label>
                    <label className="text-sm text-gray-400">승점<input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} className="mt-1 w-full bg-gray-700 text-white px-3 py-2 rounded-lg" /></label>
                    <div className="flex gap-2"><button type="submit" className="bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg font-bold">저장</button><button type="button" onClick={cancelEditing} className="bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded-lg font-bold">취소</button></div>
                  </form>
                </td>
              </tr>
            ) : (
              <tr key={member.name} className="hover:bg-gray-750">
                <td className="p-4 font-bold">{member.name}</td><td className="p-4">{member.pin}</td><td className="p-4"><PositionBadge position={member.mainPosition} /></td><td className="p-4"><PositionBadge position={member.subPosition} /></td><td className="p-4">{member.wins || 0}</td><td className="p-4">{member.losses || 0}</td><td className="p-4 text-yellow-400 font-bold">{member.points || 0}점</td><td className="p-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => startEditing(member)} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded">수정</button><button onClick={() => deleteMember(member.name)} className="bg-red-700 hover:bg-red-600 px-3 py-1 rounded">삭제</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
