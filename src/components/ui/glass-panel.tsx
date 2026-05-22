import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { Theme } from '@/constants/theme';
import { usePressScale } from '@/hooks/use-animations';

interface GlassPanelProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  intensity?: number;
  noPadding?: boolean;
  glow?: boolean;
}

export function GlassPanel({
  children,
  onPress,
  intensity = 48,
  noPadding = false,
  glow = false,
  style,
  ...props
}: GlassPanelProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();
  const padding = noPadding ? 0 : Theme.spacing.md;

  const inner = (
    <View style={[styles.borderWrap, glow && styles.glow, style]} {...props}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={intensity} tint="dark" style={styles.blur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)']}
            style={[styles.gradient, { padding }]}>
            {children}
          </LinearGradient>
        </BlurView>
      ) : (
        <View style={[styles.androidGlass, { padding }]}>{children}</View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Animated.View style={animatedStyle}>
        <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
          {inner}
        </Pressable>
      </Animated.View>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  borderWrap: {
    borderRadius: Theme.radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.colors.borderStrong,
  },
  glow: {
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  blur: { overflow: 'hidden' },
  gradient: { backgroundColor: Theme.colors.surfaceGlass },
  androidGlass: {
    backgroundColor: Theme.colors.surfaceGlass,
    borderRadius: Theme.radius.lg,
  },
});
