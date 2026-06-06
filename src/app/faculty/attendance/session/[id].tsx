import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { ArrowLeft, CheckCircle2, StopCircle, Users, Wifi } from 'lucide-react-native';

import { Avatar, Badge, GlassCard, SpringButton } from '@/components/ui';
import { Animation, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAttendanceStore } from '@/store/attendance.store';
import {
  closeAttendanceSession,
  subscribeToSessionSubmissions,
} from '@/services/attendance.service';
import {
  useAttendanceSession,
  useAttendanceSubmissions,
} from '@/hooks/queries/use-attendance';

// ─── Ring Timer (SVG) ────────────────────────────────────────────────────────
const RING_SIZE = 140;
const STROKE_WIDTH = 10;
const RADIUS_RING = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS_RING;

interface RingTimerProps {
  timeLeft: number;
  totalTime: number;
  isExpired: boolean;
  formatTime: (s: number) => string;
}

function RingTimer({ timeLeft, totalTime, isExpired, formatTime }: RingTimerProps) {
  const { theme } = useTheme();

  const progress = timeLeft / totalTime; // 1 → 0
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const ringColor = isExpired
    ? theme.colors.danger
    : timeLeft <= 60
    ? theme.colors.warning
    : theme.colors.success;

  const trackColor = isExpired
    ? `${theme.colors.danger}20`
    : timeLeft <= 60
    ? `${theme.colors.warning}20`
    : `${theme.colors.success}20`;

  return (
    <View style={styles.ringContainer}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Track */}
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS_RING}
          stroke={trackColor}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS_RING}
          stroke={ringColor}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      {/* Center text */}
      <View style={styles.ringCenter}>
        <Text
          style={[
            styles.ringTime,
            { color: isExpired ? theme.colors.danger : theme.colors.textPrimary },
          ]}
        >
          {formatTime(timeLeft)}
        </Text>
        {isExpired && (
          <Text style={[Typography.label.xs, { color: theme.colors.danger, letterSpacing: 1 }]}>
            EXPIRED
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Live Pulse Dot ───────────────────────────────────────────────────────────
function LivePulseDot({ color }: { color: string }) {
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [pulseOpacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  return <Animated.View style={[styles.liveDot, { backgroundColor: color }, animStyle]} />;
}

// ─── Empty State Pulse ────────────────────────────────────────────────────────
function EmptyStatePulse() {
  const { theme } = useTheme();
  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [pulseOpacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  return (
    <Animated.View style={[styles.emptyState, animStyle]}>
      <View
        style={[
          styles.emptyIconWrap,
          { backgroundColor: `${theme.colors.textTertiary}12` },
        ]}
      >
        <Wifi color={theme.colors.textTertiary} size={30} strokeWidth={1.5} />
      </View>
      <Text style={[Typography.headline.sm, { color: theme.colors.textSecondary, marginTop: 12 }]}>
        Waiting for students...
      </Text>
      <Text style={[Typography.body.sm, { color: theme.colors.textTertiary, marginTop: 4 }]}>
        Students will appear here when they submit
      </Text>
    </Animated.View>
  );
}

// ─── Submission Row ───────────────────────────────────────────────────────────
interface SubmissionRowProps {
  sub: { id: string; student_roll: string; submitted_at: string };
  index: number;
}

function SubmissionRow({ sub, index }: SubmissionRowProps) {
  const { theme } = useTheme();

  const initials = sub.student_roll.substring(0, 2).toUpperCase();
  const timeStr = new Date(sub.submitted_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Cycle through a few accent colors based on index
  const accentColors = [
    theme.colors.primary,
    theme.colors.info,
    theme.colors.success,
    theme.colors.warning,
  ];
  const accentColor = accentColors[index % accentColors.length];

  return (
    <Animated.View
      entering={FadeInDown.duration(350).delay(index < 5 ? index * 60 : 0).springify()}
    >
      <GlassCard
        intensity={10}
        padding={Spacing.md}
        radius={Radius.lg}
        style={[styles.submissionRow, { borderColor: theme.colors.border }]}
      >
        <Avatar initials={initials} size={42} color={accentColor} />
        <View style={styles.subInfo}>
          <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]}>
            {sub.student_roll}
          </Text>
          <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginTop: 2 }]}>
            Submitted at {timeStr}
          </Text>
        </View>
        <CheckCircle2 color={theme.colors.success} size={20} strokeWidth={2} />
      </GlassCard>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function FacultyLiveSession() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = id;

  const { activeSession, submissions, setSubmissions } = useAttendanceStore();
  const { data: fetchedSession } = useAttendanceSession(sessionId);
  const { data: fetchedSubmissions = [] } = useAttendanceSubmissions(sessionId);
  const session = activeSession ?? fetchedSession ?? null;

  const [isClosing, setIsClosing] = useState(false);

  // ── Compute initial timeLeft from session.expires_at ──────────────────────
  const computeTimeLeft = (sess: typeof session) => {
    if (!sess?.expires_at) return 300;
    const remaining = Math.floor((new Date(sess.expires_at).getTime() - Date.now()) / 1000);
    return Math.max(0, remaining);
  };

  const [timeLeft, setTimeLeft] = useState(() => computeTimeLeft(session));

  // Recompute when session loads from DB
  useEffect(() => {
    setTimeLeft(computeTimeLeft(session));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.expires_at]);

  // ── Realtime subscription + countdown ──────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;

    const subscription = subscribeToSessionSubmissions(sessionId);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(timer);
    };
  }, [sessionId]);

  useEffect(() => {
    setSubmissions(fetchedSubmissions);
  }, [fetchedSubmissions, setSubmissions]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isExpired = timeLeft === 0;

  // ── Close Session ──────────────────────────────────────────────────────────
  const handleCloseSession = () => {
    Alert.alert(
      'Close Session',
      'Are you sure you want to end this attendance session? Students will no longer be able to submit their attendance.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Session',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setIsClosing(true);
            await closeAttendanceSession(id as string);
            setIsClosing(false);
            router.back();
          },
        },
      ]
    );
  };

  // ── Session code color ─────────────────────────────────────────────────────
  const timerColor = isExpired
    ? theme.colors.danger
    : timeLeft <= 60
    ? theme.colors.warning
    : theme.colors.success;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.void }]}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.duration(380)}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        {/* Back */}
        <SpringButton
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          scaleDown={0.88}
          haptic="light"
        >
          <GlassCard
            intensity={isDark ? 25 : 50}
            padding={0}
            radius={Radius.full}
            style={styles.backBtn}
          >
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
          </GlassCard>
        </SpringButton>

        {/* Title */}
        <View style={styles.headerCenter}>
          <Text style={[Typography.headline.lg, { color: theme.colors.textPrimary, letterSpacing: -0.5 }]}>
            Live Session
          </Text>
        </View>

        {/* LIVE indicator */}
        <View style={styles.liveIndicator}>
          <LivePulseDot color={theme.colors.success} />
          <Text
            style={[
              Typography.label.xs,
              { color: theme.colors.success, letterSpacing: 1.5, fontWeight: '700', marginLeft: 5 },
            ]}
          >
            LIVE
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 130 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Session Info Card (Apple Wallet) ─────────────────────────────── */}
        <Animated.View entering={FadeInUp.duration(450).delay(80)}>
          <LinearGradient
            colors={
              isDark
                ? ['#151520', '#0D0D18']
                : ['#FFFFFF', '#F5F5FF']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.walletCard, { borderColor: theme.colors.border }]}
          >
            {/* Inner highlight */}
            <View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.8)',
                  borderRadius: Radius.xl,
                },
              ]}
              pointerEvents="none"
            />

            <View style={styles.walletRow}>
              {/* Subject + info */}
              <View style={styles.walletLeft}>
                <Text
                  style={[
                    Typography.display.small,
                    { color: theme.colors.textPrimary, letterSpacing: -1 },
                  ]}
                  numberOfLines={2}
                >
                  {session?.subject ?? 'Attendance Session'}
                </Text>
                <Text
                  style={[
                    Typography.body.sm,
                    { color: theme.colors.textSecondary, marginTop: 6 },
                  ]}
                >
                  {session?.branch ?? 'All Branches'} •{' '}
                  {session?.year ? `Year ${session.year}` : 'All Years'} •{' '}
                  {session?.section ? `Sec ${session.section}` : 'All Sections'}
                </Text>

                {/* Status badge */}
                <View style={[styles.activeBadge, { backgroundColor: `${theme.colors.success}18`, borderColor: `${theme.colors.success}30` }]}>
                  <LivePulseDot color={theme.colors.success} />
                  <Text
                    style={[
                      Typography.label.xs,
                      { color: theme.colors.success, letterSpacing: 1.2, marginLeft: 5 },
                    ]}
                  >
                    ACTIVE
                  </Text>
                </View>
              </View>

              {/* Session Code */}
              <View style={styles.walletRight}>
                <Text
                  style={[
                    Typography.label.xs,
                    {
                      color: theme.colors.textTertiary,
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                      marginBottom: 4,
                      textAlign: 'right',
                    },
                  ]}
                >
                  SESSION CODE
                </Text>
                <Text
                  style={[
                    styles.sessionCode,
                    { color: theme.colors.primary },
                  ]}
                >
                  {session?.session_code ?? '------'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Live Metrics Row ──────────────────────────────────────────────── */}
        <Animated.View entering={FadeInUp.duration(450).delay(160)} style={styles.metricsRow}>

          {/* Timer Ring Card */}
          <GlassCard
            intensity={isDark ? 20 : 55}
            padding={Spacing.lg}
            radius={Radius.xl}
            style={[
              styles.metricCard,
              { borderColor: `${timerColor}30` },
            ]}
          >
            <RingTimer
              timeLeft={timeLeft}
              totalTime={session?.expires_at
                ? Math.max(300, Math.floor((new Date(session.expires_at).getTime() - new Date(session.start_time).getTime()) / 1000))
                : 300}
              isExpired={isExpired}
              formatTime={formatTime}
            />
            <Text
              style={[
                Typography.label.sm,
                { color: theme.colors.textTertiary, marginTop: 10, textAlign: 'center' },
              ]}
            >
              Time Remaining
            </Text>
          </GlassCard>

          {/* Present Count Card */}
          <GlassCard
            intensity={isDark ? 20 : 55}
            padding={Spacing.lg}
            radius={Radius.xl}
            style={[
              styles.metricCard,
              { borderColor: `${theme.colors.info}30` },
            ]}
          >
            <Animated.View
              entering={ZoomIn.duration(500).delay(300)}
              style={styles.countContainer}
            >
              <View
                style={[
                  styles.countIconWrap,
                  { backgroundColor: `${theme.colors.info}18` },
                ]}
              >
                <Users color={theme.colors.info} size={22} strokeWidth={2} />
              </View>
              <Text
                style={[
                  styles.countNumber,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {submissions.length}
              </Text>
              <Text
                style={[
                  Typography.label.sm,
                  { color: theme.colors.textTertiary, textAlign: 'center', marginTop: 4 },
                ]}
              >
                Students Present
              </Text>

              {submissions.length > 0 && (
                <View
                  style={[
                    styles.presencePill,
                    { backgroundColor: `${theme.colors.success}15`, borderColor: `${theme.colors.success}30` },
                  ]}
                >
                  <Text
                    style={[Typography.label.xs, { color: theme.colors.success, letterSpacing: 1 }]}
                  >
                    ✓ LIVE
                  </Text>
                </View>
              )}
            </Animated.View>
          </GlassCard>
        </Animated.View>

        {/* ── Attendance Log ────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInUp.duration(450).delay(240)} style={styles.logSection}>
          {/* Section header */}
          <View style={styles.logHeader}>
            <Text
              style={[Typography.headline.lg, { color: theme.colors.textPrimary }]}
            >
              Attendance Log
            </Text>
            {submissions.length > 0 && (
              <Badge
                label={`${submissions.length} joined`}
                color={theme.colors.success}
                size="sm"
              />
            )}
          </View>

          {/* List or empty */}
          {submissions.length === 0 ? (
            <EmptyStatePulse />
          ) : (
            <View style={styles.subList}>
              {submissions.map((sub, index) => (
                <SubmissionRow key={sub.id} sub={sub} index={index} />
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* ── Close Session Footer ──────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInUp.duration(450).delay(320)}
        style={[
          styles.footer,
          {
            backgroundColor: isDark ? 'rgba(0,0,0,0.92)' : 'rgba(242,242,247,0.95)',
            borderColor: theme.colors.border,
            paddingBottom: insets.bottom + Spacing.lg,
            ...Shadows.float,
          },
        ]}
      >
        <SpringButton
          onPress={handleCloseSession}
          scaleDown={0.96}
          haptic="heavy"
          style={{ flex: 1 }}
          disabled={isClosing}
        >
          <LinearGradient
            colors={[`${theme.colors.danger}22`, `${theme.colors.danger}10`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.closeBtn,
              {
                borderWidth: 1,
                borderColor: `${theme.colors.danger}40`,
                opacity: isClosing ? 0.5 : 1,
              },
            ]}
          >
            <StopCircle color={theme.colors.danger} size={20} strokeWidth={2} />
            <Text
              style={[
                Typography.headline.md,
                { color: theme.colors.danger, marginLeft: 10 },
              ]}
            >
              {isClosing ? 'Closing Session…' : 'End Session'}
            </Text>
          </LinearGradient>
        </SpringButton>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: Spacing.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.md,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.25)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },

  // Scroll
  scroll: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: Spacing.xs,
    gap: Spacing.xl,
  },

  // Apple Wallet Card
  walletCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    ...Shadows.card,
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.lg,
  },
  walletLeft: {
    flex: 1,
  },
  walletRight: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  sessionCode: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 6,
    lineHeight: 40,
    textAlign: 'right',
  },

  // Metrics Row
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
  },

  // Ring Timer
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTime: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 34,
  },

  // Count Card
  countContainer: {
    alignItems: 'center',
    width: '100%',
  },
  countIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  countNumber: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 54,
  },
  presencePill: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },

  // Attendance Log
  logSection: {
    gap: Spacing.md,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subList: {
    gap: Spacing.sm,
  },

  // Submission Row
  submissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  subInfo: {
    flex: 1,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.15)',
    borderStyle: 'dashed',
    borderRadius: Radius.xl,
    marginTop: Spacing.sm,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: Radius.xl,
  },
});
