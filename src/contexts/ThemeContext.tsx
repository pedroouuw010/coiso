import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeColors, ThemeMode } from '../@types';
import { lightTheme, darkTheme } from '../constants/theme';
import { storageService } from '../services/storageService';

interface ThemeContextData {
  themeMode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    const loadTheme = async () => {
      const saved = await storageService.getTheme();
      if (saved) setThemeModeState(saved);
    };
    loadTheme();
  }, []);

  const setTheme = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await storageService.saveTheme(mode);
  };

  const toggleTheme = () => {
    const newTheme: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const isDark = themeMode === 'dark';
  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ themeMode, colors, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};
