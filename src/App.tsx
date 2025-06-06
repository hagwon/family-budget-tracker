import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from './hooks/firebase';
import Auth from './Auth';
import BudgetOverview from './BudgetOverview';
import ThemeToggle from './components/ThemeToggle';
import { useTheme } from './hooks/useTheme';
import './App.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { themeMode, isDarkMode, toggleThemeMode } = useTheme();

  // 인증 상태 감지 및 persistence 설정
  useEffect(() => {
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className={`loading-container ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="loading-spinner">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Auth 
        themeMode={themeMode}
        toggleThemeMode={toggleThemeMode}
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : 'light'}`}>
      <ThemeToggle
        themeMode={themeMode}
        isDarkMode={isDarkMode}
        onToggle={toggleThemeMode}
        variant="app"
        position="fixed"
      />

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

      <main className="app-main">
        <BudgetOverview isDarkMode={isDarkMode} />
      </main>
    </div>
  );
}

export default App;