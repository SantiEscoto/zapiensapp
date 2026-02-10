/**
 * Branding: títulos = Space Mono, subtítulos/cuerpo = Inter Tight (ver docs/BRANDING.md)
 */
import {
  InterTight_400Regular,
  InterTight_700Bold,
} from '@expo-google-fonts/inter-tight';
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono';

/** Títulos y encabezados: Space Mono */
export const FONTS = {
  title: 'SpaceMono_700Bold',
  titleRegular: 'SpaceMono_400Regular',
  /** Subtítulos y cuerpo: Inter Tight */
  body: 'InterTight_400Regular',
  bodyBold: 'InterTight_700Bold',
} as const;

/** Map para useFonts (cargar en _layout raíz) */
export const FONT_ASSETS = {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
  InterTight_400Regular,
  InterTight_700Bold,
} as const;
