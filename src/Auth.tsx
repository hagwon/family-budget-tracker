import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from './firebase';
import Modal from './Modal';
import './Auth.css';

interface AuthProps {
  themeMode: 'light' | 'dark' | 'random';
  toggleThemeMode: () => void;
  isDarkMode: boolean;
}

const Auth = ({ themeMode, toggleThemeMode, isDarkMode }: AuthProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Auth 화면에서 랜덤 모드일 때 랜덤하게 테마 결정
  useEffect(() => {
    if (themeMode === 'random') {
      // Auth 화면에서만 새로운 랜덤 테마 결정
      const randomValue = Math.random();
      const newIsDarkMode = randomValue > 0.5;
      // 랜덤으로 결정된 결과를 저장
      localStorage.setItem('randomThemeResult', newIsDarkMode ? 'dark' : 'light');
    }
  }, [themeMode]);

  // 모달 닫기 함수
  const closeModal = () => {
    setShowModal(false);
    setModalMessage('');
  };

  // 이메일/비밀번호 로그인
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 브라우저 세션 persistence 설정 (브라우저 종료 시 자동 로그아웃)
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      // 에러 메시지를 한국어로 변환
      let errorMessage = '';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = '등록되지 않은 이메일입니다.';
          break;
        case 'auth/wrong-password':
          errorMessage = '비밀번호가 올바르지 않습니다.';
          break;
        case 'auth/invalid-email':
          errorMessage = '올바른 이메일 형식이 아닙니다.';
          break;
        case 'auth/too-many-requests':
          errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
          break;
        case 'auth/invalid-credential':
          errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
          break;
        default:
          errorMessage = '로그인에 실패했습니다.';
          break;
      }
      
      setModalMessage(errorMessage);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-container ${isDarkMode ? 'dark' : 'light'}`}>
      {/* 테마 토글 버튼 */}
      <div className="theme-toggle" onClick={toggleThemeMode}>
        <button onClick={toggleThemeMode} className="theme-button">
          {themeMode === 'light' ? '☀️' : themeMode === 'dark' ? '🌙' : '🎲'}
        </button>
        <span className="theme-mode-text">
          {themeMode === 'light' ? '라이트' : themeMode === 'dark' ? '다크' : '랜덤'} 모드
        </span>
      </div>

      <div className="auth-card glass-card">
        <h2>
          😘 <span className="title-text">쭈 가계부</span>
        </h2>
        <p>쭈의 가족 가계부입니다.</p>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
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

      {/* 에러 모달 */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title="로그인 실패"
        message={modalMessage}
        type="error"
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default Auth;