import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { OsText } from '@/components/ui/os-text';
import { SPRING_CONFIG } from '@/animations/config';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface AttendanceRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label?: string;
}

export function AttendanceRing({
  percent,
  size = 140,
  strokeWidth = 10,
  color,
  label,
}: AttendanceRingProps) {
  const progress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    progress.value = withSpring(Math.min(100, Math.max(0, percent)) / 100, SPRING_CONFIG);
  }, [percent, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <OsText variant="hero">{Math.round(percent)}%</OsText>
        {label ? (
          <OsText variant="micro" muted>
            {label}
          </OsText>
        ) : null}
      </View>
    </View>
  );
}
