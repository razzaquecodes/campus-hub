import React from 'react';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useProgressAnimation } from '@/hooks/use-animations';
import { Colors } from '@/constants/colors';

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ progress, color = Colors.primary, height = 6 }: ProgressBarProps) {
  const animatedStyle = useProgressAnimation(progress);

  return (
    <View
      className="w-full overflow-hidden rounded-full bg-surface-elevated"
      style={{ height }}>
      <Animated.View
        style={[animatedStyle, { height, borderRadius: height / 2, backgroundColor: color }]}
      />
    </View>
  );
}

interface ProgressLabelProps {
  progress: number;
}

export function ProgressLabel({ progress }: ProgressLabelProps) {
  return (
    <Text className="text-xs font-medium text-text-tertiary">{progress}% complete</Text>
  );
}
