import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { LuxuryCalendar } from '@/components/calendar/luxury-calendar';
import { AmbientBackground } from '@/components/ui/ambient-background';
import { GlassPanel } from '@/components/ui/glass-panel';
import { OsText } from '@/components/ui/os-text';
import { MOCK_EVENTS } from '@/constants/mock-data';
import { Theme } from '@/constants/theme';
import type { Holiday } from '@/types';

export function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const holidays: Holiday[] = useMemo(
    () =>
      MOCK_EVENTS.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.starts_at.split('T')[0],
        type: e.event_type === 'exam' ? 'exam' : e.event_type === 'holiday' ? 'holiday' : 'event',
        description: e.description,
      })),
    [],
  );

  const monthEvents = holidays.filter((h) =>
    h.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`),
  );

  return (
    <AmbientBackground>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 110,
          paddingHorizontal: Theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}>
        <OsText variant="hero">Calendar</OsText>
        <OsText variant="caption" muted style={styles.sub}>
          Classes · exams · holidays · events
        </OsText>

        <Animated.View entering={FadeInDown.duration(400)}>
          <LuxuryCalendar
            year={year}
            month={month}
            holidays={holidays}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onChangeMonth={(y, m) => {
              setYear(y);
              setMonth(m);
            }}
          />
        </Animated.View>

        <OsText variant="subtitle" style={styles.section}>
          {selectedDate ? 'Selected' : 'This month'}
        </OsText>
        {monthEvents.map((e, i) => (
          <GlassPanel key={e.id} style={styles.event}>
            <View style={[styles.stripe, { backgroundColor: stripeColor(e.type) }]} />
            <View style={{ flex: 1 }}>
              <OsText variant="subtitle">{e.title}</OsText>
              {e.description ? (
                <OsText variant="caption" muted>
                  {e.description}
                </OsText>
              ) : null}
            </View>
            <OsText variant="micro" muted>
              {e.date}
            </OsText>
          </GlassPanel>
        ))}
      </ScrollView>
    </AmbientBackground>
  );
}

function stripeColor(type: string) {
  if (type === 'exam') return Theme.colors.danger;
  if (type === 'holiday') return Theme.colors.success;
  return Theme.colors.accent;
}

const styles = StyleSheet.create({
  sub: { marginBottom: Theme.spacing.lg, marginTop: 4 },
  section: { marginTop: Theme.spacing.lg, marginBottom: Theme.spacing.md },
  event: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.md, marginBottom: Theme.spacing.sm },
  stripe: { width: 3, height: 40, borderRadius: 2 },
});
