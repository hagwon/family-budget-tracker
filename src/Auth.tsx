import { useState } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from './hooks/firebase';
import Modal from './components/Modal';
import ThemeToggle from './components/ThemeToggle';
import './Auth.css';

interface AuthProps {
  themeMode: 'light' | 'dark' | 'random';
  toggleThemeMode: () => void;
  isDarkMode: boolean;
}

const AUTH_ERRORS = {
  'auth/user-not-found': '등록되지 않은 이메일입니다.',
  'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
  'auth/invalid-email': '올바른 이메일 형식이 아닙니다.',
  'auth/too-many-requests': '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
  'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/user-disabled': '비활성화된 계정입니다. 관리자에게 문의하세요.',
  'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
  'auth/internal-error': '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
} as const;

const Auth = ({ themeMode, toggleThemeMode, isDarkMode }: AuthProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setModalMessage('이메일과 비밀번호를 모두 입력해주세요.');
      setShowModal(true);
      return;
    }

    setLoading(true);

    try {
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      const errorMessage = AUTH_ERRORS[error.code as keyof typeof AUTH_ERRORS] 
        || '로그인에 실패했습니다. 다시 시도해주세요.';
      
      setModalMessage(errorMessage);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleLogin(e as any);
    }
  };

  return (
    <div className={`auth-container ${isDarkMode ? 'dark' : 'light'}`}>
      <ThemeToggle
        themeMode={themeMode}
        isDarkMode={isDarkMode}
        onToggle={toggleThemeMode}
        variant="auth"
        position="fixed"
      />

      <div className="auth-card glass-card">
        <h1>
          😘 <span className="title-text">쭈 가계부</span> 
        </h1>
        <p>쭈의 가족 가계부입니다.</p>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              required
              autoComplete="email"
              aria-label="이메일 주소"
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              required
              autoComplete="current-password"
              aria-label="비밀번호"
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading || !email.trim() || !password.trim()}
            aria-label={loading ? '로그인 처리 중' : '로그인'}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="auth-info">
          <p>🔒 <strong>보안 안내:</strong></p>
          <ul>
            <li>등록된 가족만 접근 가능합니다.</li>
            <li>계정 문의는 관리자에게 연락하세요.</li>
            <li>브라우저 종료 시 자동 로그아웃됩니다.</li>
          </ul>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="로그인 실패"
        message={modalMessage}
        type="error"
        isDarkMode={isDarkMode}
        confirmText="확인"
        icon="❌"
      />
    </div>
  );
};

export default Auth;