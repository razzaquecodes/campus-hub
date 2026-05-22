import React from 'react';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useFadeInUp } from '@/hooks/use-animations';

interface AnimatedCardProps {
  children: React.ReactNode;
  index?: number;
  className?: string;
}

export function AnimatedCard({ children, index = 0, className }: AnimatedCardProps) {
  const animatedStyle = useFadeInUp(index);

  return (
    <Animated.View style={animatedStyle} className={className}>
      {children}
    </Animated.View>
  );
}

interface AvatarProps {
  name: string;
  size?: number;
  color?: string;
}

export function Avatar({ name, size = 48, color = '#6366F1' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      className="items-center justify-center rounded-2xl"
      style={{ width: size, height: size, backgroundColor: `${color}30` }}>
      <Text className="font-bold text-text-primary" style={{ fontSize: size * 0.35, color }}>
        {initials}
      </Text>
    </View>
  );
}
