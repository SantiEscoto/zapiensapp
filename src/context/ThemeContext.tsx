import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTheme } from '../services/theme';
import { useColorScheme } from 'react-native';
import { useFocusEffect } from 'expo-router';

type ThemeType = 'light' | 'dark';
type ColorTheme = 'default' | 'green' | 'purple' | 'orange';

const themeColors = {
  default: '#1CB0F6',
  green: '#58CC02',
  purple: '#8549BA',
  orange: '#FF9600'
};

interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  error: string;
}

interface Theme {
  type: ThemeType;
  colors: ThemeColors;
  colorTheme: ColorTheme;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setColorTheme: (color: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(createTheme('dark', 'default'));

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
      const colorTheme = (savedColorTheme || 'default') as ColorTheme;
      
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