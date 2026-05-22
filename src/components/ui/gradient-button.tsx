import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { usePressScale } from '@/hooks/use-animations';

interface GradientButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function GradientButton({
  title,
  loading = false,
  variant = 'primary',
  size = 'md',
  disabled,
  className,
  ...props
}: GradientButtonProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();

  const sizeClasses = {
    sm: 'py-2.5 px-4',
    md: 'py-3.5 px-6',
    lg: 'py-4 px-8',
  }[size];

  const textSize = size === 'sm' ? 'text-sm' : 'text-base';

  if (variant === 'ghost') {
    return (
      <Animated.View style={animatedStyle}>
        <Pressable
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={disabled || loading}
          className={`items-center rounded-2xl ${sizeClasses} ${className ?? ''}`}
          {...props}>
          <Text className={`font-semibold text-text-secondary ${textSize}`}>{title}</Text>
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === 'secondary') {
    return (
      <Animated.View style={animatedStyle}>
        <Pressable
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={disabled || loading}
          className={`items-center rounded-2xl border border-border-strong bg-surface-elevated ${sizeClasses} ${className ?? ''}`}
          {...props}>
          {loading ? (
            <ActivityIndicator color={Colors.textPrimary} />
          ) : (
            <Text className={`font-semibold text-text-primary ${textSize}`}>{title}</Text>
          )}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        className={`overflow-hidden rounded-2xl ${className ?? ''}`}
        {...props}>
        <LinearGradient
          colors={Theme.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className={`items-center ${sizeClasses}`}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className={`font-semibold text-white ${textSize}`}>{title}</Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
