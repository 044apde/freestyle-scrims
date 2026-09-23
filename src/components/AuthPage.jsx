const POSITIONS = ['C', 'PF', 'CT', 'SF', 'SG', 'PG', 'SW', 'DG'];

export default function AuthPage({
  authMode,
  setAuthMode,
  loginName,
  setLoginName,
  loginPin,
  setLoginPin,
  signupName,
  setSignupName,
  signupPin,
  setSignupPin,
  signupPinConfirm,
  setSignupPinConfirm,
  invitationCode,
  setInvitationCode,
  isSigningUp,
  regMainPos,
  setRegMainPos,
  regSubPos,
  setRegSubPos,
  handleLogin,
  handleSignup
}) {
  const inputClass = 'w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelClass = 'block text-gray-400 mb-2';

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        <h1 className="text-3xl font-bold text-white text-center mb-8">클럽 라운지</h1>
        {authMode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={labelClass}>닉네임</label>
              <input type="text" value={loginName} onChange={(e) => setLoginName(e.target.value)} className={inputClass} placeholder="닉네임을 입력하세요." required />
            </div>
            <div>
              <label className={labelClass}>비밀번호</label>
              <input type="password" value={loginPin} onChange={(e) => setLoginPin(e.target.value)} maxLength={32} className={inputClass} placeholder="비밀번호를 입력하세요." required />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">로그인</button>
            <div className="border-t border-gray-700 pt-4 text-center">
              <p className="text-gray-500 text-sm mb-2">계정이 없으신가요?</p>
              <button type="button" onClick={() => setAuthMode('signup')} className="text-indigo-400 hover:text-indigo-300 font-bold">회원가입</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className={labelClass}>닉네임</label>
              <input type="text" value={signupName} onChange={(e) => setSignupName(e.target.value)} className={inputClass} placeholder="닉네임을 입력하세요." required />
            </div>
            <div>
              <label className={labelClass}>비밀번호</label>
              <input type="password" value={signupPin} onChange={(e) => setSignupPin(e.target.value)} maxLength={32} className={inputClass} placeholder="비밀번호를 입력하세요." required />
            </div>
            <div>
              <label className={labelClass}>비밀번호 확인</label>
              <input type="password" value={signupPinConfirm} onChange={(e) => setSignupPinConfirm(e.target.value)} maxLength={32} className={inputClass} placeholder="비밀번호를 다시 입력하세요." required />
            </div>
            <div>
              <label className={labelClass}>계정 생성 코드</label>
              <input type="text" value={invitationCode} onChange={(e) => setInvitationCode(e.target.value)} className={inputClass} placeholder="계정 생성 코드를 입력하세요." required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>주 포지션</label>
                <select value={regMainPos} onChange={(e) => setRegMainPos(e.target.value)} className={inputClass}>{POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}</select>
              </div>
              <div>
                <label className={labelClass}>부 포지션</label>
                <select value={regSubPos} onChange={(e) => setRegSubPos(e.target.value)} className={inputClass}>{POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}</select>
              </div>
            </div>
            <button type="submit" disabled={isSigningUp} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60 text-white font-bold py-3 px-4 rounded-lg transition-colors">
              {isSigningUp ? '가입 처리 중...' : '회원가입'}
            </button>
            <div className="border-t border-gray-700 pt-4 text-center">
              <button type="button" onClick={() => setAuthMode('login')} className="text-indigo-400 hover:text-indigo-300 font-bold">로그인으로 돌아가기</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
