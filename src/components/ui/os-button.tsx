import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { Theme } from '@/constants/theme';
import { usePressScale } from '@/hooks/use-animations';

import { OsText } from './os-text';

interface OsButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'glass';
}

export function OsButton({ label, onPress, loading, variant = 'primary' }: OsButtonProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();

  if (variant === 'ghost') {
    return (
      <Animated.View style={animatedStyle}>
        <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={styles.ghost}>
          <OsText variant="subtitle" muted>
            {label}
          </OsText>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} disabled={loading}>
        <LinearGradient colors={Theme.gradients.primary} style={styles.primary}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <OsText variant="subtitle" style={styles.primaryLabel}>
              {label}
            </OsText>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  primary: {
    paddingVertical: 16,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
  },
  primaryLabel: { color: '#fff' },
  ghost: { paddingVertical: 14, alignItems: 'center' },
});
