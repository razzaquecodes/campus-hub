import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';

import { GlassCard, SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useFacultyStore } from '@/store/faculty.store';

export default function FacultyRoutine() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { todayRoutine } = useFacultyStore();
  const [hasScheduled, setHasScheduled] = useState(false);

  useEffect(() => {
    async function scheduleClassReminders() {
      if (hasScheduled) return;
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      const upcoming = todayRoutine.filter(c => c.status === 'Upcoming');
      if (upcoming.length > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Upcoming Class: ${upcoming[0].subject}`,
            body: `Your next class starts in 10 minutes at ${upcoming[0].room}.`,
            sound: true,
          },
          trigger: null, 
        });
      }
      setHasScheduled(true);
    }
    scheduleClassReminders();
  }, [todayRoutine, hasScheduled]);

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      {/* ── Premium Header ── */}
      <Animated.View entering={FadeInDown.duration(400)} style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}>
        <SpringButton onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }} scaleDown={0.88}>
          <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
          </GlassCard>
        </SpringButton>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[Typography.display.small, { color: theme.colors.textPrimary, letterSpacing: -0.5 }]}>My Routine</Text>
          <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 2 }]}>Today</Text>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={[ss.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <View style={ss.timelineWrap}>
          {todayRoutine.map((routine, index) => {
            const isOngoing = routine.status === 'Ongoing';
            const isCompleted = routine.status === 'Completed';
            
            let strokeColor: string = theme.colors.textTertiary;
            if (isOngoing) strokeColor = theme.colors.primary;
            if (isCompleted) strokeColor = theme.colors.success;

            return (
              <Animated.View 
                key={routine.id} 
                entering={FadeInRight.duration(500).delay(150 * index)}
                layout={Layout.springify().damping(16)}
                style={ss.timelineRow}
              >
                {/* Timeline Axis */}
                <View style={ss.axis}>
                  <View style={[ss.dot, { backgroundColor: strokeColor, borderColor: theme.colors.void, borderWidth: 3 }]} />
                  {index !== todayRoutine.length - 1 && (
                    <View style={[ss.line, { backgroundColor: theme.colors.border }]} />
                  )}
                </View>

                {/* Glass Card */}
                <View style={ss.cardWrap}>
                  <GlassCard 
                    intensity={isDark ? 20 : 60} 
                    style={[ss.card, isOngoing && { borderColor: `${theme.colors.primary}50`, borderWidth: 1.5, ...Shadows.glow }]}
                  >
                    <View style={ss.cardHeader}>
                      <View style={[ss.tag, { backgroundColor: `${strokeColor}15` }]}>
                        <Text style={[Typography.label.sm, { color: strokeColor, fontWeight: '700' }]}>{routine.status.toUpperCase()}</Text>
                      </View>
                      <View style={ss.timeBox}>
                        <Clock color={theme.colors.textTertiary} size={14} />
                        <Text style={[Typography.label.md, { color: theme.colors.textSecondary, marginLeft: 6 }]}>
                          {routine.startTime} - {routine.endTime}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={[Typography.headline.md, { color: theme.colors.textPrimary, marginTop: 12, letterSpacing: -0.3 }]}>
                      {routine.subject}
                    </Text>
                    
                    <View style={[ss.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
                    
                    <View style={ss.metaRow}>
                      <View style={ss.metaItem}>
                        <Calendar color={theme.colors.textTertiary} size={16} />
                        <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginLeft: 6 }]}>
                          {routine.branch} • Sec {routine.section}
                        </Text>
                      </View>
                      <View style={ss.metaItem}>
                        <MapPin color={theme.colors.primary} size={16} />
                        <Text style={[Typography.body.md, { color: theme.colors.textPrimary, marginLeft: 6, fontWeight: '600' }]}>
                          {routine.room}
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                </View>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: Spacing.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: Spacing.md,
  },
  timelineWrap: {
    paddingLeft: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  axis: {
    width: 30,
    alignItems: 'center',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 10,
    zIndex: 2,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: -8,
    marginBottom: -Spacing.lg,
    zIndex: 1,
  },
  cardWrap: {
    flex: 1,
    marginLeft: 12,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
