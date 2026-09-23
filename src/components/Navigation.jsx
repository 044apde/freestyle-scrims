import { History, LayoutDashboard, LogOut, Shield, Trophy, User } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, currentUser, handleLogout }) {
  const tabClass = (tab) => `flex items-center space-x-2 px-3 py-2 rounded-md ${activeTab === tab ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`;

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <span className="text-xl font-bold text-white">FS Reboot</span>
            <div className="flex space-x-4">
              <button onClick={() => setActiveTab('main')} className={tabClass('main')}>
                <LayoutDashboard size={18} /><span>내전 대시보드</span>
              </button>
              <button onClick={() => setActiveTab('history')} className={tabClass('history')}>
                <History size={18} /><span>전체 매치 기록</span>
              </button>
              <button onClick={() => setActiveTab('ranking')} className={tabClass('ranking')}>
                <Trophy size={18} /><span>종합 랭킹</span>
              </button>
              <button onClick={() => setActiveTab('profile')} className={tabClass('profile')}>
                <User size={18} /><span>내 프로필</span>
              </button>
              {currentUser.isAdmin && (
                <button onClick={() => setActiveTab('accounts')} className={tabClass('accounts')}>
                  <Shield size={18} /><span>계정 관리</span>
                </button>
              )}
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
  );
}
