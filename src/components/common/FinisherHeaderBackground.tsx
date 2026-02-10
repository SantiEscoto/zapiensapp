import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const FINISHER_SCRIPT_URL = 'https://finisher.co/lab/header/assets/finisher-header.es5.min.js';

declare global {
  interface Window {
    FinisherHeader?: new (config: FinisherHeaderConfig) => void;
  }
}

interface FinisherHeaderConfig {
  count: number;
  size: { min: number; max: number; pulse: number };
  speed: { x: { min: number; max: number }; y: { min: number; max: number } };
  colors: { background: string; particles: string[] };
  blending: string;
  opacity: { center: number; edge: number };
  skew: number;
  shapes: string[];
}

/**
 * Fondo animado tipo Finisher (formas fluidas y colores) solo en web.
 * En native no renderiza nada. Usa el tema actual para background y partículas.
 */
export function FinisherHeaderBackground() {
  const { theme } = useTheme();
  const { colors } = theme;
  const containerRef = useRef<View>(null);
  const lastInitedElRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const el = containerRef.current as unknown as HTMLElement | null;
    if (!el) return;

    const root = el;
    if (!root.classList.contains('finisher-header')) {
      root.classList.add('finisher-header');
    }

    const init = () => {
      if (typeof window.FinisherHeader !== 'function') return;
      if (lastInitedElRef.current === root) return;
      lastInitedElRef.current = root;

      const config: FinisherHeaderConfig = {
        count: 6,
        size: { min: 1100, max: 1300, pulse: 0 },
        speed: {
          x: { min: 0.1, max: 0.3 },
          y: { min: 0.1, max: 0.3 },
        },
        colors: {
          background: colors.background,
          particles: [colors.primary, colors.textSecondary, colors.border],
        },
        blending: 'overlay',
        opacity: { center: 1, edge: 0.1 },
        skew: -2,
        shapes: ['c'],
      };

      try {
        new window.FinisherHeader!(config);
      } catch (e) {
        console.warn('FinisherHeader init failed', e);
      }
    };

    if (typeof window.FinisherHeader === 'function') {
      init();
      return;
    }

    const script = document.createElement('script');
    script.src = FINISHER_SCRIPT_URL;
    script.async = true;
    script.onload = init;
    document.body.appendChild(script);

    return () => {
      script.remove();
      lastInitedElRef.current = null;
    };
  }, [colors.background, colors.primary, colors.textSecondary, colors.border]);

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View ref={containerRef} style={styles.container} pointerEvents="none" />
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
});
