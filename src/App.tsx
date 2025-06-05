import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from 'firebase/auth';
import type { User }  from 'firebase/auth';
import { auth } from './firebase';
import Auth from './Auth';
import BudgetOverview from './BudgetOverview';
import './App.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'random'>('light');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 테마 모드 초기화
  useEffect(() => {
    const savedThemeMode = localStorage.getItem('themeMode') as 'light' | 'dark' | 'random';
    if (savedThemeMode) {
      setThemeMode(savedThemeMode);
    }
  }, []);

  // 테마 적용 로직
  useEffect(() => {
    let newIsDarkMode = false;

    if (themeMode === 'light') {
      newIsDarkMode = false;
    } else if (themeMode === 'dark') {
      newIsDarkMode = true;
    } else if (themeMode === 'random') {
      // 랜덤 모드일 때는 저장된 결과 사용 또는 새로 생성
      const savedRandomResult = localStorage.getItem('randomThemeResult');
      if (savedRandomResult) {
        newIsDarkMode = savedRandomResult === 'dark';
      } else {
        newIsDarkMode = Math.random() > 0.5;
        localStorage.setItem('randomThemeResult', newIsDarkMode ? 'dark' : 'light');
      }
    }

    setIsDarkMode(newIsDarkMode);
  }, [themeMode]);

  // 인증 상태 감지 및 persistence 설정
  useEffect(() => {
    // 브라우저 세션 persistence 설정 (브라우저 종료 시 자동 로그아웃)
    const initializeAuth = async () => {
      try {
        await setPersistence(auth, browserSessionPersistence);
      } catch (error) {
        console.error('Error setting persistence:', error);
      }
    };

    initializeAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 테마 모드 토글
  const toggleThemeMode = () => {
    const modes: ('light' | 'dark' | 'random')[] = ['light', 'dark', 'random'];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const newMode = modes[nextIndex];
    
    setThemeMode(newMode);
    localStorage.setItem('themeMode', newMode);
    
    // 랜덤 모드로 변경될 때 새로운 랜덤 결과 생성
    if (newMode === 'random') {
      localStorage.removeItem('randomThemeResult');
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // 로딩 중
  if (loading) {
    return (
      <div className={`loading-container ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="loading-spinner">로딩 중...</div>
      </div>
    );
  }

  // 로그인되지 않은 경우 Auth 컴포넌트 표시
  if (!user) {
    return (
      <Auth 
        themeMode={themeMode}
        toggleThemeMode={toggleThemeMode}
        isDarkMode={isDarkMode}
      />
    );
  }

  // 로그인된 경우 메인 애플리케이션 표시
  return (
    <div className={`app-container ${isDarkMode ? 'dark' : 'light'}`}>
      {/* 테마 토글 버튼 */}
      <div className="theme-toggle">
        <button onClick={toggleThemeMode} className="theme-button">
          {themeMode === 'light' ? '☀️' : themeMode === 'dark' ? '🌙' : '🎲'}
        </button>
        <span className="theme-mode-text">
          {themeMode === 'light' ? '라이트' : themeMode === 'dark' ? '다크' : '랜덤'} 모드
        </span>
      </div>

      {/* 앱 헤더 */}
      <header className="app-header">
        <h1>
          😘 <span className="title-text">쭈 가계부</span>
        </h1>
        <div className="user-info">
          <span>{user.email}</span>
          <button onClick={handleLogout} className="logout-button">
            로그아웃
          </button>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="app-main">
        <BudgetOverview isDarkMode={isDarkMode} />
      </main>
    </div>
  );
}

export default App;