import React from 'react';
import { StyleSheet, View } from 'react-native';

import { GlassPanel } from '@/components/ui/glass-panel';
import { OsText } from '@/components/ui/os-text';
import { Theme } from '@/constants/theme';

import { TrendBars } from './trend-bars';

interface MonthlyChartProps {
  data: { month: string; percent: number }[];
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const values = data.map((d) => d.percent);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  return (
    <GlassPanel style={styles.wrap}>
      <View style={styles.head}>
        <OsText variant="subtitle">Monthly insights</OsText>
        <OsText variant="caption" accent>
          Avg {avg}%
        </OsText>
      </View>
      <TrendBars values={values} color={Theme.colors.primaryLight} height={64} />
      <View style={styles.labels}>
        {data.map((d) => (
          <OsText key={d.month} variant="micro" muted style={styles.label}>
            {d.month}
          </OsText>
        ))}
      </View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Theme.spacing.md },
  head: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Theme.spacing.md },
  labels: { flexDirection: 'row', marginTop: 8 },
  label: { flex: 1, textAlign: 'center' },
});
