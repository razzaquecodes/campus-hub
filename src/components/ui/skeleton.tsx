import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({ width = '100%', height = 16, className, rounded = 'md' }: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 900 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const radius = { sm: 4, md: 8, lg: 16, full: 9999 }[rounded];

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius }, animatedStyle]}
      className={`bg-surface-elevated ${className ?? ''}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <View className="rounded-2xl border border-border bg-surface p-4">
      <Skeleton height={20} width="60%" className="mb-3" />
      <Skeleton height={14} width="40%" className="mb-4" />
      <Skeleton height={8} width="100%" rounded="full" />
    </View>
  );
}
