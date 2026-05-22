import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AmbientBackground } from '@/components/ui/ambient-background';
import { GlassPanel } from '@/components/ui/glass-panel';
import { OsText } from '@/components/ui/os-text';
import { Theme } from '@/constants/theme';
import { useAssignments } from '@/hooks/use-assignments';

type Filter = 'all' | 'pending' | 'done';

export function AssignmentsScreen() {
  const insets = useSafeAreaInsets();
  const { assignments, pending, completed, toggleComplete } = useAssignments();
  const [filter, setFilter] = useState<Filter>('pending');

  const list =
    filter === 'pending' ? pending : filter === 'done' ? completed : assignments;

  return (
    <AmbientBackground>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 110,
          paddingHorizontal: Theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}>
        <OsText variant="hero">Tasks</OsText>
        <OsText variant="caption" muted style={styles.sub}>
          AI planner · deadlines · progress
        </OsText>

        <View style={styles.tabs}>
          {(['pending', 'done', 'all'] as Filter[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.tab, filter === f && styles.tabActive]}>
              <OsText variant="micro" accent={filter === f} muted={filter !== f}>
                {f.toUpperCase()}
              </OsText>
            </Pressable>
          ))}
        </View>

        {list.map((a, i) => (
          <Animated.View key={a.id} entering={FadeInDown.delay(i * 40).duration(350)}>
            <GlassPanel onPress={() => toggleComplete(a.id)} style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.check, a.completed && styles.checkDone]}>
                  {a.completed ? <OsText variant="micro">✓</OsText> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <OsText
                    variant="subtitle"
                    muted={a.completed}
                    style={a.completed ? styles.doneTitle : undefined}>
                    {a.title}
                  </OsText>
                  <OsText variant="caption" muted>
                    {a.subject_name}
                  </OsText>
                </View>
                <OsText variant="micro" accent>
                  {a.progress}%
                </OsText>
              </View>
              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${a.progress}%` }]} />
              </View>
            </GlassPanel>
          </Animated.View>
        ))}
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  sub: { marginBottom: Theme.spacing.md, marginTop: 4 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: Theme.spacing.lg },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Theme.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.colors.border,
  },
  tabActive: { borderColor: Theme.colors.primary, backgroundColor: `${Theme.colors.primary}18` },
  card: { marginBottom: Theme.spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Theme.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { borderColor: Theme.colors.success, backgroundColor: `${Theme.colors.success}30` },
  doneTitle: { textDecorationLine: 'line-through' },
  bar: {
    height: 3,
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: 2,
    marginTop: Theme.spacing.md,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: Theme.colors.primary },
});
