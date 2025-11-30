import React from 'react';
import { Surface as PaperSurface } from 'react-native-paper';
import { StyleSheet } from 'react-native';

type CustomSurfaceProps = React.ComponentProps<typeof PaperSurface>;

export const CustomSurface: React.FC<CustomSurfaceProps> = ({ style, ...props }) => {
  return (
    <PaperSurface
      {...props}
      style={[styles.surface, style]}
    />
  );
};

const styles = StyleSheet.create({
  surface: {
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
});