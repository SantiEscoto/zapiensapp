import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
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

/** Escala el tamaño de los círculos: en viewport pequeño (móvil) son más pequeños para que se aprecie el efecto. */
function getCircleSizeForViewport(width: number, height: number) {
  const minSide = Math.min(width, height);
  // Escritorio: tamaño original (1100–1300). Por debajo de ~900px escalamos hacia abajo.
  const scale = minSide >= 900 ? 1 : Math.max(0.28, minSide / 900);
  const min = Math.round(1100 * scale);
  const max = Math.round(1300 * scale);
  return { min: Math.max(300, min), max: Math.max(380, max) };
}

/**
 * Fondo animado tipo Finisher (formas fluidas y colores) solo en web.
 * Responsive: en ventanas pequeñas (móvil) los círculos son más pequeños para que el efecto se aprecie.
 * El contenedor cubre todo el área sin cortes.
 */
export function FinisherHeaderBackground() {
  const { theme } = useTheme();
  const { colors } = theme;
  const { width, height } = useWindowDimensions();
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
      lastInitedElRef.current = root;
      root.innerHTML = '';

      const circleSize = getCircleSizeForViewport(width, height);

      const config: FinisherHeaderConfig = {
        count: 6,
        size: { min: circleSize.min, max: circleSize.max, pulse: 0 },
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
      return () => {
        lastInitedElRef.current = null;
      };
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
  }, [width, height, colors.background, colors.primary, colors.textSecondary, colors.border]);

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View
      ref={containerRef}
      style={[styles.container, styles.containerWeb, { width, height }]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    top: 0,
    left: 0,
    zIndex: 0,
    overflow: 'hidden',
  },
  // En web: fixed al viewport para que el fondo cubra toda la pantalla (incl. esquina inferior derecha)
  containerWeb: Platform.select({
    web: {
      position: 'fixed' as const,
      right: 0,
      bottom: 0,
    },
    default: {
      position: 'absolute' as const,
      right: 0,
      bottom: 0,
    },
  }),
});
