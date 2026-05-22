import React, { useState } from 'react';
import { TextInput, View, Text, type TextInputProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { SPRING_CONFIG } from '@/animations/config';

interface FloatingInputProps extends TextInputProps {
  label: string;
  error?: string;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export function FloatingInput({ label, error, value, onFocus, onBlur, ...props }: FloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);
  const hasValue = Boolean(value && String(value).length > 0);

  const handleFocus = (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
    setIsFocused(true);
    focusAnim.value = withSpring(1, SPRING_CONFIG);
    onFocus?.(e);
  };

  const handleBlur = (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
    setIsFocused(false);
    focusAnim.value = withSpring(hasValue ? 1 : 0, SPRING_CONFIG);
    onBlur?.(e);
  };

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: withSpring(isFocused || hasValue ? -28 : 0, SPRING_CONFIG) },
      { scale: withSpring(isFocused || hasValue ? 0.85 : 1, SPRING_CONFIG) },
    ],
    color: interpolateColor(
      focusAnim.value,
      [0, 1],
      [Colors.textTertiary, isFocused ? Colors.primaryLight : Colors.textSecondary],
    ),
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusAnim.value,
      [0, 1],
      [Colors.border, Colors.primary],
    ),
  }));

  return (
    <View className="mb-5">
      <Animated.View
        style={borderStyle}
        className="rounded-2xl border bg-surface px-4 pb-3 pt-6">
        <Animated.Text
          style={labelStyle}
          className="absolute left-4 top-4 text-base font-medium">
          {label}
        </Animated.Text>
        <AnimatedTextInput
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={Colors.textTertiary}
          className="text-base text-text-primary"
          {...props}
        />
      </Animated.View>
      {error ? <Text className="mt-1.5 px-1 text-sm text-danger">{error}</Text> : null}
    </View>
  );
}
