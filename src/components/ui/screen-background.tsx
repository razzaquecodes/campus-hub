import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, type ViewProps } from 'react-native';

import { Colors } from '@/constants/colors';

interface ScreenBackgroundProps extends ViewProps {
  children: React.ReactNode;
}

export function ScreenBackground({ children, className, ...props }: ScreenBackgroundProps) {
  return (
    <View className={`flex-1 bg-background ${className ?? ''}`} {...props}>
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.12)', 'transparent', 'rgba(34, 211, 238, 0.06)']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400 }}
      />
      <LinearGradient
        colors={['transparent', 'rgba(139, 92, 246, 0.08)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 300 }}
      />
      {children}
    </View>
  );
}

export function GlowOrb({ color = Colors.primaryGlow, size = 200, top = -60, right = -40 }: {
  color?: string;
  size?: number;
  top?: number;
  right?: number;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        top,
        right,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: 0.6,
      }}
    />
  );
}
