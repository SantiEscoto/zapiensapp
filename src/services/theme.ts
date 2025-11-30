export type ThemeType = 'light' | 'dark';
export type ColorTheme = 'default' | 'green' | 'purple' | 'orange';

export const themeColors = {
  default: '#1CB0F6',
  green: '#58CC02',
  purple: '#8549BA',
  orange: '#FF9600'
};

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  error: string;
}

export interface Theme {
  type: ThemeType;
  colors: ThemeColors;
  colorTheme: ColorTheme;
}

export const createTheme = (type: ThemeType, colorTheme: ColorTheme): Theme => ({
  type,
  colorTheme,
  colors: {
    background: type === 'dark' ? '#131f24' : '#F5F5F5',
    card: type === 'dark' ? '#202f36' : '#FFFFFF',
    text: type === 'dark' ? '#FFFFFF' : '#000000',
    textSecondary: type === 'dark' ? '#A0AEC0' : '#666666',
    border: type === 'dark' ? '#37464f' : '#E5E5E5',
    primary: themeColors[colorTheme],
    error: '#FF3B30',
  },
}); 