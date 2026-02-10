export type ThemeType = 'light' | 'dark';

/** Los 6 temas de marca: cada uno con primary y fondos que combinan (tonalidad por tema) */
export type ColorTheme = 'ocean' | 'royal' | 'forest' | 'citrus' | 'cherry' | 'candy';

/** Primary (CTA, acentos) por tema */
export const themeColors = {
  ocean: '#0074e4',
  royal: '#8624f5',
  forest: '#4ade80',
  citrus: '#ff6a00',
  cherry: '#ff003c',
  candy: '#ff3eb5',
} as const;

/** Por tema: fondos y bordes en modo dark (variaciones de negro con tonalidad) */
const darkPalette: Record<ColorTheme, { background: string; card: string; border: string; textSecondary: string }> = {
  ocean: {
    background: '#0a1628',
    card: '#0f2744',
    border: '#1e3a5f',
    textSecondary: '#8ba3c7',
  },
  royal: {
    background: '#1a0a2e',
    card: '#2d1a4a',
    border: '#4a2d6b',
    textSecondary: '#b8a0d4',
  },
  forest: {
    background: '#0a1a0a',
    card: '#0f2e0f',
    border: '#1e4a1e',
    textSecondary: '#8bc49a',
  },
  citrus: {
    background: '#2a1a0a',
    card: '#3d2810',
    border: '#5c4015',
    textSecondary: '#d4b88a',
  },
  cherry: {
    background: '#2a0a14',
    card: '#401a28',
    border: '#5c2840',
    textSecondary: '#d48a9e',
  },
  candy: {
    background: '#2a0a1f',
    card: '#401a35',
    border: '#5c2850',
    textSecondary: '#d4a0c4',
  },
};

/** Por tema: fondos en modo light (claros con tinte suave) */
const lightPalette: Record<ColorTheme, { background: string; card: string; border: string; textSecondary: string }> = {
  ocean: {
    background: '#f0f7ff',
    card: '#FFFFFF',
    border: '#b3d4ff',
    textSecondary: '#004ba8',
  },
  royal: {
    background: '#f5f0ff',
    card: '#FFFFFF',
    border: '#e0d0ff',
    textSecondary: '#5200a3',
  },
  forest: {
    background: '#f0fff4',
    card: '#FFFFFF',
    border: '#b8e6c8',
    textSecondary: '#007a00',
  },
  citrus: {
    background: '#fffbf0',
    card: '#FFFFFF',
    border: '#ffddb3',
    textSecondary: '#b35c00',
  },
  cherry: {
    background: '#fff0f5',
    card: '#FFFFFF',
    border: '#ffcce0',
    textSecondary: '#a8002a',
  },
  candy: {
    background: '#fff0fc',
    card: '#FFFFFF',
    border: '#ffd6f5',
    textSecondary: '#b8007a',
  },
};

/** Referencia: branding original (teal) por si se usa en web/docs */
export const zapiensBrand = {
  backgroundDark: '#003333',
  backgroundCard: '#0a4545',
  primary: '#FF8C00',
  turquoise: '#40E0D0',
  textOnDark: '#FFFFFF',
  textMuted: '#d1d5db',
} as const;

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

const ERROR_RED = '#ff003c';

export const createTheme = (type: ThemeType, colorTheme: ColorTheme): Theme => {
  const isDark = type === 'dark';
  const palette = isDark ? darkPalette[colorTheme] : lightPalette[colorTheme];
  return {
    type,
    colorTheme,
    colors: {
      background: palette.background,
      card: palette.card,
      text: isDark ? '#FFFFFF' : '#1A1A1A',
      textSecondary: palette.textSecondary,
      border: palette.border,
      primary: themeColors[colorTheme],
      error: ERROR_RED,
    },
  };
};
