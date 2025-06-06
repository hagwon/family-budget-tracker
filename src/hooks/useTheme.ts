// src/hooks/useTheme.ts
import { useState, useEffect } from 'react';

export const useTheme = () => {
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

  const toggleThemeMode = () => {
    const modes: ('light' | 'dark' | 'random')[] = ['light', 'dark', 'random'];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const newMode = modes[nextIndex];
    
    setThemeMode(newMode);
    localStorage.setItem('themeMode', newMode);
    
    if (newMode === 'random') {
      localStorage.removeItem('randomThemeResult');
    }
  };

  return {
    themeMode,
    isDarkMode,
    toggleThemeMode
  };
};