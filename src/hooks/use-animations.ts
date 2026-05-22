import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { SPRING_CONFIG, STAGGER_DELAY } from '@/animations/config';

export function useFadeInUp(index = 0, enabled = true) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);

  useEffect(() => {
    if (!enabled) return;
    const delay = index * STAGGER_DELAY;
    opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(delay, withSpring(0, SPRING_CONFIG));
  }, [enabled, index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return animatedStyle;
}

export function usePressScale() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.96, SPRING_CONFIG);
  };

  const onPressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  return { animatedStyle, onPressIn, onPressOut };
}

export function useProgressAnimation(target: number) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(target / 100, SPRING_CONFIG);
  }, [target, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return animatedStyle;
}
