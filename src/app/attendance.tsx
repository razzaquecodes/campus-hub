import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Radio,
  RefreshCw,
  Shield,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { SpringButton } from '@/components/ui';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useActiveAttendanceSessions } from '@/hooks/queries/use-attendance';
import { useMasterProfile } from '@/hooks/use-master-profile';
import { attendanceRepository } from '@/repositories/attendance.repository';
import { audienceToLabel } from '@/services/targeting.service';
import { useAttendanceStore } from '@/store/attendance.store';
import type { AttendanceSession } from '@/types/attendance';
import { safeBack } from '@/lib/navigation';

const { width: SW } = Dimensions.get('window');

const FLOW_STEPS = [
  { label: 'Detected', icon: Radio, color: '#6366F1' },
  { label: 'Selfie', icon: Camera, color: '#8B5CF6' },
  { label: 'Board', icon: ClipboardCheck, color: '#A78BFA' },
  { label: 'Verified', icon: CheckCircle2, color: '#34D399' },
] as const;

// ─── Animated pulse dot ───────────────────────────────────────────────────────
function PulseDot({ color }: { color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 700 }),
        withTiming(1, { duration: 700 }),
      ),
      -1,
      true,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    backgroundColor: color,
    width: 8,
    height: 8,
    borderRadius: 4,
  }));

  return <Animated.View style={animStyle} />;
}

// ─── Scanning radar animation ─────────────────────────────────────────────────
function RadarScan() {
  const angle = useSharedValue(0);
  const outerScale = useSharedValue(0.4);
  const outerOpacity = useSharedValue(0.8);

  useEffect(() => {
    angle.value = withRepeat(
      withTiming(360, { duration: 2400, easing: Easing.linear }),
      -1,
      false,
    );
    outerScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.out(Easing.ease) }),
        withTiming(0.4, { duration: 1200, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      false,
    );
    outerOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1200 }),
        withTiming(0.8, { duration: 1200 }),
      ),
      -1,
      false,
    );
  }, [angle, outerScale, outerOpacity]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.value}deg` }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerScale.value }],
    opacity: outerOpacity.value,
  }));

  const SIZE = 180;
  const R = SIZE / 2;

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Static rings */}
      {[0.35, 0.65, 1].map((ratio, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: SIZE * ratio,
            height: SIZE * ratio,
            borderRadius: (SIZE * ratio) / 2,
            borderWidth: 1,
            borderColor: `rgba(99,102,241,${0.25 - i * 0.07})`,
          }}
        />
      ))}

      {/* Animated outer pulse */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: SIZE,
            height: SIZE,
            borderRadius: R,
            borderWidth: 2,
            borderColor: 'rgba(99,102,241,0.5)',
          },
          ringStyle,
        ]}
      />

      {/* Sweep */}
      <Animated.View style={[{ position: 'absolute', width: SIZE, height: SIZE }, sweepStyle]}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={R} cy={R} r={R - 2}
            fill="none"
            stroke="rgba(99,102,241,0.35)"
            strokeWidth={R - 2}
            strokeDasharray={`${Math.PI * R / 2} ${2 * Math.PI * R}`}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>

      {/* Center dot */}
      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#6366F1' }} />
    </View>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────
function SessionCard({ session, index }: { session: AttendanceSession; index: number }) {
  const { theme, isDark } = useTheme();
  const setActiveSession = useAttendanceStore((state) => state.setActiveSession);
  const cardScale = useSharedValue(1);

  const handleSubmit = () => {
    cardScale.value = withSpring(0.97, { damping: 12 }, () => {
      cardScale.value = withSpring(1);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setActiveSession(session);
    router.push(`/attendance/submit/${session.id}`);
  };

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: cardScale.value }] }));

  const sessionMins = session.expires_at
    ? Math.max(0, Math.ceil((new Date(session.expires_at).getTime() - Date.now()) / 60000))
    : null;

  return (
    <Animated.View
      entering={FadeInUp.duration(500).delay(index * 80).springify()}
      layout={Layout.springify()}
      style={cardStyle}
    >
      <View
        style={[
          ss.sessionCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {/* Card top strip */}
        <LinearGradient
          colors={isDark ? ['rgba(99,102,241,0.12)', 'transparent'] : ['rgba(79,70,229,0.06)', 'transparent']}
          style={ss.cardTopStrip}
        />

        {/* Header row */}
        <View style={ss.cardHeader}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text
              style={[ss.sessionSubject, { color: theme.colors.textPrimary }]}
              numberOfLines={2}
            >
              {session.subject}
            </Text>
            <Text style={[ss.sessionMeta, { color: theme.colors.textSecondary }]}>
              {audienceToLabel(session.target)}
            </Text>
          </View>

          {/* LIVE badge */}
          <View style={ss.liveBadge}>
            <PulseDot color="#EF4444" />
            <Text style={ss.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={[ss.statsRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: theme.colors.border }]}>
          <View style={ss.statItem}>
            <Text style={[ss.statValue, { color: theme.colors.primary }]}>
              {session.live_count}
            </Text>
            <Text style={[ss.statLabel, { color: theme.colors.textTertiary }]}>submitted</Text>
          </View>
          {sessionMins !== null && (
            <View style={ss.statItem}>
              <Text style={[ss.statValue, { color: sessionMins <= 1 ? '#F87171' : '#FBBF24' }]}>
                {sessionMins}m
              </Text>
              <Text style={[ss.statLabel, { color: theme.colors.textTertiary }]}>remaining</Text>
            </View>
          )}
          <View style={ss.statItem}>
            <Text style={[ss.statValue, { color: '#34D399' }]}>#{session.session_code}</Text>
            <Text style={[ss.statLabel, { color: theme.colors.textTertiary }]}>code</Text>
          </View>
        </View>

        {/* Flow step rail */}
        <View style={ss.stepRail}>
          {FLOW_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <View key={step.label} style={ss.stepItem}>
                <View style={[ss.stepIconWrap, { backgroundColor: `${step.color}15`, borderColor: `${step.color}30` }]}>
                  <Icon color={step.color} size={15} strokeWidth={2.5} />
                </View>
                <Text style={[ss.stepLabel, { color: theme.colors.textTertiary }]}>{step.label}</Text>
                {i < FLOW_STEPS.length - 1 && (
                  <View style={[ss.stepLine, { backgroundColor: theme.colors.border }]} />
                )}
              </View>
            );
          })}
        </View>

        {/* CTA */}
        <SpringButton onPress={handleSubmit} scaleDown={0.96} style={{ marginTop: 20 }}>
          <LinearGradient
            colors={['#6366F1', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={ss.ctaBtn}
          >
            <Shield color="#fff" size={18} strokeWidth={2.5} />
            <Text style={ss.ctaText}>Start Verification</Text>
          </LinearGradient>
        </SpringButton>
      </View>
    </Animated.View>
  );
}

// ─── Empty / loading state ────────────────────────────────────────────────────
function EmptyState({ isLoading, isOffline }: { isLoading: boolean; isOffline?: boolean }) {
  const { theme } = useTheme();

  return (
    <Animated.View entering={FadeIn.duration(500)} style={ss.emptyWrap}>
      {isLoading ? (
        <View style={ss.emptyContent}>
          <RadarScan />
          <Text style={[ss.emptyTitle, { color: theme.colors.textPrimary }]}>
            Scanning for sessions...
          </Text>
          <Text style={[ss.emptyDesc, { color: theme.colors.textSecondary }]}>
            Looking for active attendance sessions nearby.
          </Text>
        </View>
      ) : isOffline ? (
        <View style={ss.emptyContent}>
          <View style={[ss.emptyIconWrap, { backgroundColor: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.2)' }]}>
            <WifiOff color="#F87171" size={40} strokeWidth={1.5} />
          </View>
          <Text style={[ss.emptyTitle, { color: theme.colors.textPrimary }]}>Offline</Text>
          <Text style={[ss.emptyDesc, { color: theme.colors.textSecondary }]}>
            Check your internet connection and try again.
          </Text>
        </View>
      ) : (
        <View style={ss.emptyContent}>
          <View style={[ss.emptyIconWrap, { backgroundColor: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.2)' }]}>
            <Wifi color="#6366F1" size={40} strokeWidth={1.5} />
          </View>
          <Text style={[ss.emptyTitle, { color: theme.colors.textPrimary }]}>
            No Active Sessions
          </Text>
          <Text style={[ss.emptyDesc, { color: theme.colors.textSecondary }]}>
            When your professor starts attendance, it will appear here instantly.
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function StudentAttendanceRoute() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const masterProfile = useMasterProfile();
  const setSessions = useAttendanceStore((state) => state.setSessions);

  const profileTarget = masterProfile
    ? { branch: masterProfile.branch, year: masterProfile.year, section: masterProfile.section }
    : null;

  const { data: sessions = [], refetch, isLoading, isRefetching } = useActiveAttendanceSessions(profileTarget);
  const [refreshing, setRefreshing] = React.useState(false);
  const refreshSpinAngle = useSharedValue(0);

  const onRefresh = async () => {
    setRefreshing(true);
    refreshSpinAngle.value = withRepeat(
      withTiming(360, { duration: 800, easing: Easing.linear }),
      2,
      false,
    );
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const refreshStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${refreshSpinAngle.value}deg` }],
  }));

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
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      {/* ── Header ── */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[ss.header, { paddingTop: insets.top + 12 }]}
      >
        <SpringButton onPress={() => safeBack('/(tabs)')} scaleDown={0.88}>
          <View style={[ss.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: theme.colors.border }]}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
          </View>
        </SpringButton>

        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={[ss.headerTitle, { color: theme.colors.textPrimary }]}>Attendance</Text>
          {masterProfile && (
            <Text style={[ss.headerSub, { color: theme.colors.textTertiary }]}>
              {masterProfile.branch} · Year {masterProfile.year} · Sec {masterProfile.section}
            </Text>
          )}
        </View>

        {/* Refresh button */}
        <SpringButton onPress={onRefresh} scaleDown={0.88} disabled={isRefetching}>
          <View style={[ss.refreshBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: theme.colors.border }]}>
            <Animated.View style={refreshStyle}>
              <RefreshCw
                color={isRefetching ? theme.colors.primary : theme.colors.textSecondary}
                size={18}
                strokeWidth={2.5}
              />
            </Animated.View>
          </View>
        </SpringButton>
      </Animated.View>

      {/* ── Session count strip ── */}
      {sessions.length > 0 && (
        <Animated.View
          entering={FadeInDown.duration(400).delay(60)}
          style={[ss.sessionCountStrip, { backgroundColor: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)' }]}
        >
          <PulseDot color="#6366F1" />
          <Text style={ss.sessionCountText}>
            {sessions.length} active session{sessions.length > 1 ? 's' : ''} found
          </Text>
        </Animated.View>
      )}

      <ScrollView
        contentContainerStyle={[
          ss.content,
          { paddingBottom: insets.bottom + 40 },
          sessions.length === 0 && ss.contentCentered,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isRefetching}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {sessions.length > 0 ? (
          sessions.map((session, index) => (
            <SessionCard key={session.id} session={session} index={index} />
          ))
        ) : (
          <EmptyState isLoading={isLoading} />
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, fontWeight: '400', marginTop: 2 },

  sessionCountStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  sessionCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
    letterSpacing: 0.1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  contentCentered: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  // Session Card
  sessionCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 6,
  },
  cardTopStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sessionSubject: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  sessionMeta: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 4,
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 1.5,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
    gap: 0,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Flow step rail
  stepRail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  stepLine: {
    position: 'absolute',
    top: 19,
    left: '55%',
    width: '90%',
    height: 1.5,
    zIndex: 1,
    borderRadius: 1,
  },

  // CTA
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 18,
    gap: 10,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  // Empty
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  emptyContent: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 21,
  },
});
