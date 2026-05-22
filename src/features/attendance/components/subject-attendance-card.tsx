import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { GlassPanel } from '@/components/ui/glass-panel';
import { OsText } from '@/components/ui/os-text';
import { Theme } from '@/constants/theme';
import type { SubjectAttendanceRecord } from '@/features/attendance/types';
import {
  classesNeededForTarget,
  getAttendanceColor,
  getAttendanceLevel,
  getAttendancePercent,
  getStatusLabel,
} from '@/utils/attendance';

import { AttendanceRing } from './attendance-ring';
import { TrendBars } from './trend-bars';

interface SubjectAttendanceCardProps {
  subject: SubjectAttendanceRecord;
  index: number;
}

export function SubjectAttendanceCard({ subject, index }: SubjectAttendanceCardProps) {
  const percent = getAttendancePercent(subject.attended, subject.total);
  const level = getAttendanceLevel(percent);
  const color = getAttendanceColor(percent);
  const needed = classesNeededForTarget(subject.attended, subject.total);

  return (
    <Animated.View entering={FadeInRight.delay(index * 60).springify()}>
      <GlassPanel style={styles.card} glow={level === 'critical'}>
        <View style={styles.row}>
          <View style={styles.info}>
            <OsText variant="micro" accent>
              {subject.subjectCode}
            </OsText>
            <OsText variant="subtitle" numberOfLines={2}>
              {subject.subjectName}
            </OsText>
            <OsText variant="caption" muted>
              {subject.facultyName}
            </OsText>
            <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: color }]}>
              <OsText variant="micro" style={{ color }}>
                {getStatusLabel(level)}
              </OsText>
            </View>
          </View>
          <AttendanceRing percent={percent} size={88} strokeWidth={7} color={color} />
        </View>

        <View style={styles.stats}>
          <Stat label="Attended" value={`${subject.attended}/${subject.total}`} />
          <Stat label="Classes left" value={needed > 0 ? `${needed} needed` : 'On track'} />
        </View>

        {subject.monthlyTrend.length > 0 ? (
          <View style={styles.trend}>
            <OsText variant="micro" muted style={styles.trendLabel}>
              6-MONTH TREND
            </OsText>
            <TrendBars values={subject.monthlyTrend} color={color} />
          </View>
        ) : null}
      </GlassPanel>
    </Animated.View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <OsText variant="micro" muted>
        {label}
      </OsText>
      <OsText variant="caption">{value}</OsText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Theme.spacing.sm },
  row: { flexDirection: 'row', gap: Theme.spacing.md },
  info: { flex: 1 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
  },
  stats: { flexDirection: 'row', marginTop: Theme.spacing.md, gap: Theme.spacing.lg },
  stat: { gap: 2 },
  trend: { marginTop: Theme.spacing.md, paddingTop: Theme.spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Theme.colors.border },
  trendLabel: { marginBottom: 8, letterSpacing: 0.8 },
});
