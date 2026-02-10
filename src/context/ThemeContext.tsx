import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTheme, type ThemeType, type ColorTheme, type Theme } from '../services/theme';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setColorTheme: (color: ColorTheme) => void;
}

/** Migra temas antiguos (default/green/purple/orange) a los 6 nuevos */
const LEGACY_COLOR_MAP: Record<string, ColorTheme> = {
  default: 'ocean',
  green: 'forest',
  purple: 'royal',
  orange: 'citrus',
};

function normalizeColorTheme(saved: string | null): ColorTheme {
  const valid: ColorTheme[] = ['ocean', 'royal', 'forest', 'citrus', 'cherry', 'candy'];
  if (saved && valid.includes(saved as ColorTheme)) return saved as ColorTheme;
  if (saved && LEGACY_COLOR_MAP[saved]) return LEGACY_COLOR_MAP[saved];
  return 'ocean';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(createTheme('dark', 'ocean'));

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const [savedThemeType, savedColorTheme] = await Promise.all([
        AsyncStorage.getItem('themeType'),
        AsyncStorage.getItem('colorTheme')
      ]);

      const themeType = (savedThemeType || 'dark') as ThemeType;
      const colorTheme = normalizeColorTheme(savedColorTheme);
      
      setTheme(createTheme(themeType, colorTheme));
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newType = theme.type === 'dark' ? 'light' : 'dark';
    const newTheme = createTheme(newType, theme.colorTheme);
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('themeType', newType);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setColorTheme = async (colorTheme: ColorTheme) => {
    const newTheme = createTheme(theme.type, colorTheme);
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('colorTheme', colorTheme);
    } catch (error) {
      console.error('Error saving color theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 