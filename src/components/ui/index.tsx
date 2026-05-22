import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';

import { Animation, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export { AmbientBackground } from './ambient-background';
export { AnimatedCard, Avatar } from './animated-card';
export { FloatingInput } from './floating-input';
export { GlassCard } from './glass-card';
export { GlassPanel } from './glass-panel';
export { GradientButton } from './gradient-button';
export { OsButton } from './os-button';
export { OsText } from './os-text';
export { PriorityBadge } from './priority-badge';
export { ProgressBar, ProgressLabel } from './progress-bar';
export { ScreenBackground, GlowOrb } from './screen-background';
export { SectionHeader } from './section-header';
export { Skeleton, SkeletonCard } from './skeleton';

interface SurfaceCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  radius?: number;
}

export function SurfaceCard({
  children,
  style,
  padding = Spacing.lg,
  radius = Radius.lg,
}: SurfaceCardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: radius,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding,
          ...Shadows.cardLight,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

interface SpringButtonProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  haptic?: 'light' | 'medium' | 'heavy' | false;
  scaleDown?: number;
}

export function SpringButton({
  children,
  style,
  haptic = 'light',
  scaleDown = 0.97,
  onPress,
  ...rest
}: SpringButtonProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(scaleDown, Animation.spring.snappy);
    if (haptic) {
      Haptics.impactAsync(
        haptic === 'light'
          ? Haptics.ImpactFeedbackStyle.Light
          : haptic === 'medium'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Heavy,
      );
    }
  }, [haptic, scaleDown, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, Animation.spring.bouncy);
  }, [scale]);

  return (
    <Animated.View style={[animStyle, style as any]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        {...rest}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

interface PrimaryButtonProps {
  label: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'ghost' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  fullWidth = false,
  size = 'md',
  variant = 'solid',
  disabled = false,
}: PrimaryButtonProps) {
  const { theme } = useTheme();

  const heights = { sm: 38, md: 50, lg: 58 };
  const fontStyles = {
    sm: Typography.label.lg,
    md: Typography.headline.sm,
    lg: Typography.headline.md,
  };

  const variantStyles: Record<string, { bg: string; text: string; border: string }> = {
    solid: { bg: theme.colors.primary, text: '#FFFFFF', border: 'transparent' },
    ghost: { bg: theme.colors.primaryMuted, text: theme.colors.primaryLight, border: 'transparent' },
    outline: { bg: 'transparent', text: theme.colors.primary, border: theme.colors.primary },
    danger: { bg: theme.colors.dangerMuted, text: theme.colors.danger, border: 'transparent' },
  };

  const vs = variantStyles[variant];

  return (
    <SpringButton
      onPress={onPress}
      disabled={disabled}
      haptic="medium"
      scaleDown={0.96}
      style={{ alignSelf: fullWidth ? 'stretch' : 'flex-start' }}>
      <LinearGradient
        colors={variant === 'solid' ? [theme.colors.primaryLight, theme.colors.primaryDark] : [vs.bg, vs.bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: heights[size],
          paddingHorizontal: size === 'sm' ? 16 : size === 'md' ? 24 : 32,
          borderRadius: Radius.pill,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: vs.border,
          opacity: disabled ? 0.4 : 1,
        }}>
        {icon}
        <Text style={[fontStyles[size], { color: vs.text }]}>{label}</Text>
      </LinearGradient>
    </SpringButton>
  );
}

interface StatTileProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  entering?: any;
}

export function StatTile({ label, value, sub, color, icon, trend, entering }: StatTileProps) {
  const { theme } = useTheme();
  const trendColors = {
    up: theme.colors.success,
    down: theme.colors.danger,
    neutral: theme.colors.textSecondary,
  };

  return (
    <Animated.View
      entering={entering}
      style={{
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...Shadows.cardLight,
      }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={[Typography.label.lg, { color: theme.colors.textTertiary, textTransform: 'uppercase' }]}>
          {label}
        </Text>
        {icon ? (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: Radius.sm,
              backgroundColor: color ? `${color}20` : theme.colors.primaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {icon}
          </View>
        ) : null}
      </View>
      <Text style={[Typography.display.small, { color: color ?? theme.colors.textPrimary }]}>
        {value}
      </Text>
      {sub ? (
        <Text
          style={[
            Typography.label.md,
            {
              color: trend ? trendColors[trend] : theme.colors.textSecondary,
              marginTop: 4,
            },
          ]}>
          {trend === 'up' ? '↑ ' : trend === 'down' ? '↓ ' : ''}
          {sub}
        </Text>
      ) : null}
    </Animated.View>
  );
}

interface BadgeProps {
  label: string;
  color?: string;
  size?: 'sm' | 'md';
}

export function Badge({ label, color, size = 'sm' }: BadgeProps) {
  const { theme } = useTheme();
  const c = color ?? theme.colors.primary;

  return (
    <View
      style={{
        backgroundColor: `${c}20`,
        borderRadius: Radius.pill,
        paddingHorizontal: size === 'sm' ? 8 : 12,
        paddingVertical: size === 'sm' ? 3 : 5,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: `${c}40`,
      }}>
      <Text style={[size === 'sm' ? Typography.label.xs : Typography.label.md, { color: c }]}>
        {label}
      </Text>
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { theme } = useTheme();
  return <View style={[{ height: 1, backgroundColor: theme.colors.border, marginVertical: Spacing.lg }, style]} />;
}
