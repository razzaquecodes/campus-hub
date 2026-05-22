import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { SPRING_CONFIG } from '@/animations/config';
import { Theme } from '@/constants/theme';

interface TrendBarsProps {
  values: number[];
  color: string;
  height?: number;
}

export function TrendBars({ values, color, height = 48 }: TrendBarsProps) {
  const max = Math.max(...values, 100);

  return (
    <View style={[styles.row, { height }]}>
      {values.map((v, i) => (
        <Bar key={i} value={v} max={max} color={color} delay={i * 40} height={height} />
      ))}
    </View>
  );
}

function Bar({
  value,
  max,
  color,
  delay,
  height,
}: {
  value: number;
  max: number;
  color: string;
  delay: number;
  height: number;
}) {
  const h = useSharedValue(0);

  useEffect(() => {
    h.value = withSpring((value / max) * height, { ...SPRING_CONFIG, damping: 16 });
  }, [value, max, height, h]);

  const style = useAnimatedStyle(() => ({
    height: h.value,
  }));

  return (
    <View style={styles.barWrap}>
      <Animated.View style={[styles.bar, { backgroundColor: color }, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  barWrap: { flex: 1, justifyContent: 'flex-end' },
  bar: { borderRadius: 4, minHeight: 4, opacity: 0.85 },
});
