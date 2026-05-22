// components/premium-input-field.tsx
// Premium input field with validation, focus states, and error handling

import * as Haptics from 'expo-haptics';
import { AlertCircle, CheckCircle2 } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    Pressable,
    Text,
    TextInput,
    TextInputProps,
    View,
    ViewStyle
} from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { Animation, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export interface PremiumInputFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  error?: string;
  success?: boolean;
  helperText?: string;
  disabled?: boolean;
  style?: ViewStyle;
  validator?: (value: string) => boolean;
  secureTextEntry?: boolean;
}

export function PremiumInputField({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  rightIcon,
  onRightIconPress,
  error,
  success,
  helperText,
  disabled = false,
  style,
  validator,
  secureTextEntry = false,
  ...rest
}: PremiumInputFieldProps) {
  const { theme, isDark } = useTheme();
  const [focused, setFocused] = useState(false);
  const scale = useSharedValue(1);

  const isValid = validator ? validator(value) : success;
  const showError = !!error && value.length > 0;

  const handleFocus = useCallback(() => {
    setFocused(true);
    scale.value = withSpring(1.02, Animation.spring.snappy);
  }, []);

  const handleBlur = useCallback(() => {
    setFocused(false);
    scale.value = withSpring(1, Animation.spring.bouncy);
    if (focused && isValid) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [focused, isValid]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const borderColor = showError
    ? theme.colors.danger
    : focused
    ? theme.colors.primary
    : isValid && value.length > 0
    ? theme.colors.success
    : theme.colors.borderStrong;

  const backgroundColor = focused
    ? isDark
      ? '#1C1C1C'
      : '#FFFFFF'
    : theme.colors.void;

  return (
    <Animated.View style={[animStyle, style]}>
      <View style={{ marginBottom: Spacing.lg }}>
        {/* Label */}
        <Text
          style={[
            Typography.label.lg,
            {
              color: theme.colors.textSecondary,
              marginBottom: 8,
            },
          ]}>
          {label}
        </Text>

        {/* Input Container */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor,
            borderRadius: Radius.md,
            borderWidth: 1.5,
            borderColor,
            paddingHorizontal: 14,
            height: 52,
            gap: 10,
            opacity: disabled ? 0.5 : 1,
          }}>
          {icon && icon}

          <TextInput
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textTertiary}
            secureTextEntry={secureTextEntry}
            editable={!disabled}
            style={[
              Typography.body.md,
              {
                flex: 1,
                color: theme.colors.textPrimary,
              },
            ]}
            {...rest}
          />

          {/* Right Icon / Status Icon */}
          {showError && (
            <AlertCircle color={theme.colors.danger} size={18} />
          )}
          {!showError && isValid && value.length > 0 && (
            <CheckCircle2 color={theme.colors.success} size={18} />
          )}
          {rightIcon && !showError && !isValid && (
            <Pressable onPress={onRightIconPress}>
              {rightIcon}
            </Pressable>
          )}
        </View>

        {/* Helper / Error Text */}
        {(helperText || showError) && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}>
            <Text
              style={[
                Typography.caption,
                {
                  color: showError ? theme.colors.danger : theme.colors.textTertiary,
                  marginTop: 6,
                },
              ]}>
              {showError ? error : helperText}
            </Text>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

export default PremiumInputField;
