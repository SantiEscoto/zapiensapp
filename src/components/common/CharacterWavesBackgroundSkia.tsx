import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions, Platform, View } from 'react-native';
import {
  Canvas,
  Text,
  matchFont,
  Group,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

const WORDS = [
  'bienvenido',
  'welcome',
  'bienvenue',
  'willkommen',
  'bem-vindo',
  '欢迎',
  'ようこそ',
  '환영',
  'добро',
  'қош',
];

const CHAR_STREAM = (() => {
  const s = WORDS.join('');
  let out = s;
  while (out.length < 600) out += s;
  return out;
})();

const FIXED_COLS = 22;
const FIXED_ROWS = 28;
const TOPOLOGY_CYCLE_MS = 28000;

function topologyValue(i: number, j: number, phase: number): number {
  const p = phase * 2 * Math.PI;
  return (
    Math.sin(i * 0.22 + p) * 0.35 +
    Math.sin(j * 0.18 + p * 0.8) * 0.35 +
    Math.sin((i + j) * 0.14 + p * 1.2) * 0.3
  );
}

function topologyToOpacity(t: number): number {
  if (t < -0.6) return 0;
  if (t < -0.2) return 0.25;
  if (t < 0.2) return 0.5;
  return 0.75;
}

type WaveCellProps = {
  i: number;
  j: number;
  char: string;
  x: number;
  y: number;
  color: string;
  font: ReturnType<typeof matchFont> | null;
  phase: SharedValue<number>;
  cellH: number;
};

function WaveCell({ i, j, char, x, y, color, font, phase, cellH }: WaveCellProps) {
  const opacity = useDerivedValue(() => {
    const p = phase.value;
    const t = topologyValue(i, j, p);
    return topologyToOpacity(t);
  }, [phase, i, j]);

  if (font == null) return null;
  return (
    <Text
      text={char}
      x={x}
      y={y + cellH}
      font={font}
      color={color}
      opacity={opacity}
    />
  );
}

export type CharacterWavesBackgroundSkiaProps = {
  color: string;
};

export function CharacterWavesBackgroundSkia({ color }: CharacterWavesBackgroundSkiaProps) {
  const phase = useSharedValue(0);
  const { width: W, height: H } = Dimensions.get('window');

  const cellW = W / FIXED_COLS;
  const cellH = H / FIXED_ROWS;

  const font = useMemo(() => {
    try {
      const fontFamily = Platform.select({ ios: 'Menlo', default: 'monospace' });
      return matchFont({
        fontFamily,
        fontSize: 13,
      });
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    phase.value = withRepeat(
      withSequence(
        withTiming(1, { duration: TOPOLOGY_CYCLE_MS / 2 }),
        withTiming(0, { duration: TOPOLOGY_CYCLE_MS / 2 })
      ),
      -1,
      false
    );
  }, [phase]);

  const cells = useMemo(() => {
    const result: Array<{ i: number; j: number; char: string; x: number; y: number }> = [];
    for (let j = 0; j < FIXED_ROWS; j++) {
      for (let i = 0; i < FIXED_COLS; i++) {
        const idx = j * FIXED_COLS + i;
        const char = CHAR_STREAM[idx % CHAR_STREAM.length];
        const x = i * cellW + 2;
        const y = j * cellH;
        result.push({ i, j, char, x, y });
      }
    }
    return result;
  }, [cellW, cellH]);

  if (font == null) {
    return <View style={StyleSheet.absoluteFill} pointerEvents="none" />;
  }

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Group>
        {cells.map((cell, idx) => (
          <WaveCell
            key={idx}
            i={cell.i}
            j={cell.j}
            char={cell.char}
            x={cell.x}
            y={cell.y}
            color={color}
            font={font}
            phase={phase}
            cellH={cellH}
          />
        ))}
      </Group>
    </Canvas>
  );
}
