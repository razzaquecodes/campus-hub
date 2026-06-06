import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ArrowLeft, Camera, CheckCircle2, ClipboardCheck, Radio, Users } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SpringButton } from '@/components/ui';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useActiveAttendanceSessions } from '@/hooks/queries/use-attendance';
import { useMasterProfile } from '@/hooks/use-master-profile';
import { attendanceRepository } from '@/repositories/attendance.repository';
import { audienceToLabel } from '@/services/targeting.service';
import { useAttendanceStore } from '@/store/attendance.store';
import type { AttendanceSession } from '@/types/attendance';

const FLOW_STEPS = [
  { label: 'Found', icon: Radio },
  { label: 'Selfie', icon: Camera },
  { label: 'Board', icon: ClipboardCheck },
  { label: 'Submit', icon: CheckCircle2 },
];

function PulseDot({ color }: { color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.4, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0.3, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    backgroundColor: color,
    width: 8,
    height: 8,
    borderRadius: 4,
  }));

  return <Animated.View style={animatedStyle} />;
}

function SessionCard({ session, index }: { session: AttendanceSession; index: number }) {
  const { theme, isDark } = useTheme();
  const setActiveSession = useAttendanceStore((state) => state.setActiveSession);

  const handleSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setActiveSession(session);
    router.push(`/attendance/submit/${session.id}`);
  };

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(index * 100).springify()} layout={Layout.springify()}>
      <View style={[
        styles.walletCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: isDark ? '#000000' : theme.colors.primary,
        }
      ]}>
        <View style={styles.sessionHeader}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={[Typography.headline.lg, { color: theme.colors.textPrimary, letterSpacing: -0.5 }]} numberOfLines={2}>
              {session.subject}
            </Text>
            <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 4 }]}>
              {audienceToLabel(session.target)}
            </Text>
          </View>
          <View style={[styles.livePill, { backgroundColor: `${theme.colors.danger}15`, borderColor: `${theme.colors.danger}30` }]}>
            <PulseDot color={theme.colors.danger} />
            <Text style={[Typography.label.sm, { color: theme.colors.danger, fontWeight: '800', marginLeft: 6, letterSpacing: 0.5 }]}>LIVE</Text>
          </View>
        </View>

        <View style={[styles.statsBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: theme.colors.border }]}>
          <Users color={theme.colors.textSecondary} size={18} strokeWidth={2.5} />
          <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginLeft: 8 }]}>
            <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]}>{session.live_count}</Text> students submitted
          </Text>
        </View>

        <View style={styles.stepRail}>
          {FLOW_STEPS.map((step, stepIndex) => {
            const Icon = step.icon;
            return (
              <View key={step.label} style={styles.stepItem}>
                <View style={[styles.stepIconWrap, { backgroundColor: isDark ? '#1C1F26' : '#F4F5F7', borderColor: theme.colors.border }]}>
                  <Icon color={theme.colors.primary} size={16} strokeWidth={2.5} />
                </View>
                <Text style={[Typography.label.xs, { color: theme.colors.textSecondary, marginTop: 6, textAlign: 'center' }]}>
                  {step.label}
                </Text>
                {stepIndex < FLOW_STEPS.length - 1 && (
                  <View style={[styles.stepLine, { backgroundColor: isDark ? '#2A2D35' : '#E2E8F0' }]} />
                )}
              </View>
            );
          })}
        </View>

        <SpringButton onPress={handleSubmit} scaleDown={0.96} style={{ marginTop: 24 }}>
          <View style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}>
            <Camera color="#fff" size={20} strokeWidth={2.5} />
            <Text style={[Typography.headline.md, { color: '#fff', marginLeft: 10 }]}>Start Capture</Text>
          </View>
        </SpringButton>
      </View>
    </Animated.View>
  );
}

export default function StudentAttendanceRoute() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const masterProfile = useMasterProfile();
  const setSessions = useAttendanceStore((state) => state.setSessions);
  const profileTarget = masterProfile
    ? {
        branch: masterProfile.branch,
        year: masterProfile.year,
        section: masterProfile.section,
      }
    : null;

  const { data: sessions = [], refetch, isLoading } = useActiveAttendanceSessions(profileTarget);

  useEffect(() => {
    setSessions(sessions);
  }, [sessions, setSessions]);

  useEffect(() => {
    const subscription = attendanceRepository.subscribeToSessions(() => {
      refetch();
    });
    return () => subscription.unsubscribe();
  }, [refetch]);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.void }]}>
      <Animated.View entering={FadeInDown.duration(400)} style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <SpringButton onPress={() => router.back()} scaleDown={0.88}>
          <View style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: theme.colors.border }]}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
          </View>
        </SpringButton>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[Typography.display.small, { color: theme.colors.textPrimary, letterSpacing: -0.5 }]}>Attendance</Text>
          <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 2 }]}>
            {masterProfile ? `${masterProfile.branch} • Year ${masterProfile.year} • Sec ${masterProfile.section}` : 'Student Workflow'}
          </Text>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {sessions.length > 0 ? (
          sessions.map((session, index) => <SessionCard key={session.id} session={session} index={index} />)
        ) : (
          <Animated.View entering={FadeInUp.duration(500)} style={styles.emptyWrap}>
            <View style={[styles.emptyCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <View style={[styles.emptyIconRing, { borderColor: `${theme.colors.primary}20` }]}>
                <View style={[styles.emptyIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <Radio color={theme.colors.primary} size={32} strokeWidth={2.5} />
                </View>
              </View>
              <Text style={[Typography.display.xs, { color: theme.colors.textPrimary, marginTop: 24, letterSpacing: -0.5 }]}>
                {isLoading ? 'Scanning...' : 'No Sessions'}
              </Text>
              <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 12, textAlign: 'center', maxWidth: '85%' }]}>
                {isLoading ? 'Looking for active classes nearby.' : 'When your professor starts an attendance session, it will appear here instantly.'}
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: Spacing.md,
    gap: 16,
  },
  walletCard: {
    borderRadius: Radius.xxl || 24,
    borderWidth: 1,
    padding: Spacing.xl,
    marginBottom: Spacing.sm,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginTop: Spacing.lg,
  },
  stepRail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 24,
    paddingHorizontal: 4,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepLine: {
    position: 'absolute',
    top: 18,
    left: '60%',
    width: '80%',
    height: 2,
    zIndex: 1,
  },
  primaryButton: {
    height: 56,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  emptyWrap: {
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    width: '100%',
    borderRadius: Radius.xxl || 24,
    borderWidth: 1,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  emptyIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
