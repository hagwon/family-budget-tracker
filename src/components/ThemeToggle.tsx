import React from 'react';
import './ThemeToggle.css';

interface ThemeToggleProps {
  themeMode: 'light' | 'dark' | 'random';
  isDarkMode: boolean;
  onToggle: () => void;
  className?: string;
  position?: 'fixed' | 'relative' | 'absolute';
  variant?: 'auth' | 'app';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  themeMode,
  isDarkMode,
  onToggle,
  className = '',
  position = 'fixed',
  variant = 'auth'
}) => {
  
  // 테마별 아이콘 반환
  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'random':
        return '🎲';
      default:
        return '☀️';
    }
  };

  // 테마별 텍스트 반환
  const getThemeText = () => {
    switch (themeMode) {
      case 'light':
        return '라이트';
      case 'dark':
        return '다크';
      case 'random':
        return '랜덤';
      default:
        return '라이트';
    }
  };

  // Enter 키와 Space 키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div 
      className={`theme-toggle ${variant} ${isDarkMode ? 'dark' : 'light'} ${position} ${className}`}
      onClick={onToggle}
      onKeyPress={handleKeyPress}
      role="button"
      tabIndex={0}
      aria-label={`현재 ${getThemeText()} 모드. 클릭하여 테마 변경`}
    >
      <button 
        onClick={onToggle}
        onKeyPress={handleKeyPress}
        className="theme-button"
        aria-label={`${getThemeText()} 모드 아이콘`}
        tabIndex={-1} // 부모에서 포커스 관리
      >
        {getThemeIcon()}
      </button>
      <span className="theme-mode-text">
        {getThemeText()} 모드
      </span>
    </div>
  );
};

export default ThemeToggle;