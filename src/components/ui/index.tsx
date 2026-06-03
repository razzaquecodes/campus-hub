// components/ui/index.tsx
// CampusHub — Shared Premium UI Components
import { BlurView } from 'expo-blur';
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
  ViewStyle,
  type PressableProps,
} from 'react-native';
import Animated, {
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

// ─── Re-export Animated entering presets ─────────────────────────────────────
export { FadeIn, FadeInDown, FadeInUp, ZoomIn };

// ─── Glass Card ──────────────────────────────────────────────────────────────
interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  padding?: number;
  radius?: number;
  gradient?: boolean;
}

export function GlassCard({
  children,
  style,
  intensity = 20,
  padding = Spacing.lg,
  radius = Radius.lg,
  gradient = false,
}: GlassCardProps) {
  const { theme, isDark } = useTheme();

  return (
    <Animated.View
      style={[
        {
          borderRadius: radius,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.colors.glassBorder,
          ...Shadows.card,
        },
        style,
      ]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={intensity} tint={isDark ? 'dark' : 'light'} style={{ flex: 1 }}>
          {gradient && (
            <LinearGradient
              colors={theme.colors.gradientCard as any}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}
          <View style={{ padding }}>{children}</View>
        </BlurView>
      ) : (
        <View
          style={{
            backgroundColor: isDark
              ? theme.colors.glassMedium
              : theme.colors.glassStrong,
          }}>
          {gradient && (
            <LinearGradient
              colors={theme.colors.gradientCard as any}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}
          <View style={{ padding }}>{children}</View>
        </View>
      )}
    </Animated.View>
  );
}

// ─── Surface Card ─────────────────────────────────────────────────────────────
export function SurfaceCard({
  children,
  style,
  padding = Spacing.lg,
  radius = Radius.lg,
}: GlassCardProps) {
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

// ─── Pressable with haptic spring scale ──────────────────────────────────────
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
  }, [haptic, scale, scaleDown]);

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

// ─── Primary Button ───────────────────────────────────────────────────────────
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
    solid:   { bg: theme.colors.primary, text: '#FFFFFF', border: 'transparent' },
    ghost:   { bg: theme.colors.primaryMuted, text: theme.colors.primaryLight, border: 'transparent' },
    outline: { bg: 'transparent', text: theme.colors.primary, border: theme.colors.primary },
    danger:  { bg: theme.colors.dangerMuted, text: theme.colors.danger, border: 'transparent' },
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
        colors={variant === 'solid'
          ? [theme.colors.primaryLight, theme.colors.primaryDark]
          : [vs.bg, vs.bg]}
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

// ─── Stat Tile ────────────────────────────────────────────────────────────────
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
        {icon && (
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
        )}
      </View>
      <Text style={[Typography.display.small, { color: color ?? theme.colors.textPrimary }]}>
        {value}
      </Text>
      {sub && (
        <Text
          style={[
            Typography.label.md,
            {
              color: trend ? trendColors[trend] : theme.colors.textSecondary,
              marginTop: 4,
            },
          ]}>
          {trend === 'up' ? '↑ ' : trend === 'down' ? '↓ ' : ''}{sub}
        </Text>
      )}
    </Animated.View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({ title, action, onAction, style }: SectionHeaderProps) {
  const { theme } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, style]}>
      <Text style={[Typography.headline.lg, { color: theme.colors.textPrimary }]}>{title}</Text>
      {action && (
        <Pressable onPress={onAction}>
          <Text style={[Typography.label.lg, { color: theme.colors.primary }]}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Gradient Badge ───────────────────────────────────────────────────────────
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

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { theme } = useTheme();
  return (
    <View
      style={[{ height: 1, backgroundColor: theme.colors.border, marginVertical: Spacing.lg }, style]}
    />
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
interface AvatarProps {
  initials?: string;
  imageUri?: string;
  size?: number;
  color?: string;
}

export function Avatar({ initials = '?', size = 44, color }: AvatarProps) {
  const { theme } = useTheme();
  const bg = color ?? theme.colors.primary;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `${bg}25`,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: `${bg}40`,
      }}>
      <Text style={[Typography.headline.sm, { color: bg, fontSize: size * 0.35 }]}>
        {initials}
      </Text>
    </View>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
export function Skeleton({ width, height, radius = Radius.sm }: { width: number | string; height: number; radius?: number }) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.4);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    const interval = setInterval(() => {
      opacity.value = withTiming(0.4, { duration: 600 }, () => {
        opacity.value = withTiming(1, { duration: 600 });
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[style, { width: width as any, height, borderRadius: radius, backgroundColor: theme.colors.surface }]}
    />
  );
}

// ─── Re-export other existing separate UI components ──────────────────────────
export { AmbientBackground } from './ambient-background';
export { AnimatedCard } from './animated-card';
export { FloatingInput } from './floating-input';
export { GlassPanel } from './glass-panel';
export { GradientButton } from './gradient-button';
export { OsButton } from './os-button';
export { OsText } from './os-text';
export { PriorityBadge } from './priority-badge';
export { ProgressBar, ProgressLabel } from './progress-bar';
export { ScreenBackground, GlowOrb } from './screen-background';

// ─── Empty & Error States ──────────────────────────────────────────────────
import { AlertCircle, FileSearch } from 'lucide-react-native';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const { theme } = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 20 }}>
      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: `${theme.colors.primary}10`, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        {icon || <FileSearch color={theme.colors.primary} size={36} />}
      </View>
      <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 8, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>{message}</Text>
      {actionLabel && onAction && (
        <PrimaryButton onPress={onAction}  label={actionLabel} />
      )}
    </Animated.View>
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  const { theme, isDark } = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center', justifyContent: 'center', padding: 32, marginVertical: 20, marginHorizontal: 20, backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.04)', borderRadius: Radius.xl, borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)' }}>
      <AlertCircle color={theme.colors.danger} size={42} style={{ marginBottom: 16 }} />
      <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 8, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>{message}</Text>
      {onRetry && (
        <SpringButton onPress={onRetry} scaleDown={0.95}>
          <View style={{ paddingHorizontal: 24, paddingVertical: 12, backgroundColor: theme.colors.surface, borderRadius: Radius.full, borderWidth: 1, borderColor: theme.colors.border }}>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: '600', fontSize: 14 }}>Try Again</Text>
          </View>
        </SpringButton>
      )}
    </Animated.View>
  );
}
