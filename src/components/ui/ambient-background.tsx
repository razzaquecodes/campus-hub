import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { Theme } from '@/constants/theme';

interface AmbientBackgroundProps extends ViewProps {
  children: React.ReactNode;
}

export function AmbientBackground({ children, style, ...props }: AmbientBackgroundProps) {
  return (
    <View style={[styles.root, style]} {...props}>
      <LinearGradient
        colors={Theme.gradients.ambient}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={Theme.gradients.glowPurple}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.6 }}
        style={styles.glowTopLeft}
      />
      <LinearGradient
        colors={Theme.gradients.glowBlue}
        start={{ x: 1, y: 0.2 }}
        end={{ x: 0, y: 1 }}
        style={styles.glowBottomRight}
      />
      <View style={styles.vignette} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Theme.colors.void,
  },
  glowTopLeft: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.9,
  },
  glowBottomRight: {
    position: 'absolute',
    bottom: 80,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.7,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
});
