import { withSpring, withTiming, Easing } from 'react-native-reanimated';

export const SPRING_CONFIG = {
  damping: 18,
  stiffness: 180,
  mass: 0.8,
} as const;

export const SPRING_GENTLE = {
  damping: 22,
  stiffness: 120,
  mass: 1,
} as const;

export const TIMING_CONFIG = {
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
} as const;

export const STAGGER_DELAY = 80;

export function springTo(value: number) {
  'worklet';
  return withSpring(value, SPRING_CONFIG);
}

export function fadeIn() {
  'worklet';
  return withTiming(1, { ...TIMING_CONFIG, duration: 400 }, undefined);
}

export function slideUp(index: number) {
  return index * STAGGER_DELAY;
}
