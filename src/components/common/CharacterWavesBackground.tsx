import React from 'react';
import { StyleSheet, Platform, View } from 'react-native';

type Props = {
  color: string;
};

export function CharacterWavesBackground(props: Props) {
  if (Platform.OS === 'web') {
    return <View style={StyleSheet.absoluteFill} pointerEvents="none" />;
  }
  const CharacterWavesBackgroundSkia = require('./CharacterWavesBackgroundSkia').CharacterWavesBackgroundSkia;
  return <CharacterWavesBackgroundSkia {...props} />;
}
