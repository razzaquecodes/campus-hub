// screens/attendance-screen.tsx
// CampusHub — Premium Attendance Screen
// Circular arc progress + per-subject breakdown + Reanimated entry

import { router } from 'expo-router';
import {
  AlertCircle, ArrowLeft, CheckCircle, XCircle, Filter,
} from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
  ScrollView, Text, View,
} from 'react-native';
import Animated, {
  FadeIn, FadeInDown, FadeInLeft, FadeInUp,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Badge, GlassCard, SectionHeader, SpringButton, StatTile, EmptyState } from '@/components/ui';
import { safeBack } from '@/lib/navigation';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Circular Progress Arc ────────────────────────────────────────────────────
const ARC_SIZE = 220;
const ARC_STROKE = 16;
const ARC_R = (ARC_SIZE - ARC_STROKE) / 2;
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_R;

interface CircularProgressProps {
  percentage: number;
  color: string;
  bg: string;
}

function CircularProgress({ percentage, color, bg }: CircularProgressProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(400, withTiming(percentage / 100, { duration: 1200 }));
  }, [percentage, progress]);

  const animProps = useAnimatedProps(() => ({
    strokeDashoffset: ARC_CIRCUMFERENCE * (1 - progress.value),
  }));

  return (
    <Svg width={ARC_SIZE} height={ARC_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
      {/* Track */}
      <Circle
        cx={ARC_SIZE / 2}
        cy={ARC_SIZE / 2}
        r={ARC_R}
        stroke={bg}
        strokeWidth={ARC_STROKE}
        fill="none"
      />
      {/* Progress arc */}
      <AnimatedCircle
        cx={ARC_SIZE / 2}
        cy={ARC_SIZE / 2}
        r={ARC_R}
        stroke={color}
        strokeWidth={ARC_STROKE}
        fill="none"
        strokeDasharray={ARC_CIRCUMFERENCE}
        animatedProps={animProps}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Subject data ─────────────────────────────────────────────────────────────
// Hardcoded dummy data has been removed.
const SUBJECTS: Array<{ id: string; name: string; code: string; attended: number; total: number; color: string }> = [];
const RECENT_RECORDS: Array<{ date: string; subject: string; status: string }> = [];

function getStatusColor(pct: number, colors: ReturnType<typeof useTheme>['theme']['colors']) {
  if (pct >= 85) return colors.success;
  if (pct >= 75) return colors.warning;
  return colors.danger;
}

function SubjectAttendanceRow({
  subject,
  index,
}: {
  subject: (typeof SUBJECTS)[number];
  index: number;
}) {
  const { theme } = useTheme();
  const pct = Math.round((subject.attended / subject.total) * 100);
  const color = getStatusColor(pct, theme.colors);
  const barProgress = useSharedValue(0);

  useEffect(() => {
    barProgress.value = withDelay(
      600 + index * 80,
      withSpring(pct / 100, { damping: 20, stiffness: 180 }),
    );
  }, [barProgress, index, pct]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barProgress.value * 100}%`,
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 60 + 480)}>
      <View style={{
        backgroundColor: theme.colors.surface,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]}>
              {subject.name}
            </Text>
            <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginTop: 2 }]}>
              {subject.code} · {subject.attended}/{subject.total} classes
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[Typography.headline.lg, { color }]}>
              {pct}%
            </Text>
            {pct < 75 && (
              <Text style={[Typography.label.xs, { color: theme.colors.danger }]}>
                Need {Math.ceil((0.75 * subject.total - subject.attended) / 0.25)} more
              </Text>
            )}
          </View>
        </View>

        <View style={{
          height: 5,
          backgroundColor: `${color}20`,
          borderRadius: 3,
          overflow: 'hidden',
        }}>
          <Animated.View style={[barStyle, {
            height: '100%',
            backgroundColor: color,
            borderRadius: 3,
          }]} />
        </View>
      </View>
    </Animated.View>
  );
}

export function AttendanceScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const overallAttended = SUBJECTS.length > 0 ? SUBJECTS.reduce((a, s) => a + s.attended, 0) : 0;
  const overallTotal    = SUBJECTS.length > 0 ? SUBJECTS.reduce((a, s) => a + s.total, 0) : 0;
  const overallPct      = overallTotal > 0 ? Math.round((overallAttended / overallTotal) * 100) : 0;
  const overallColor    = getStatusColor(overallPct, theme.colors);

  // Animated percentage text — drive via JS state for display
  const [displayPct, setDisplayPct] = React.useState(0);
  useEffect(() => {
    let start = 0;
    const step = overallPct / 50;
    const timer = setInterval(() => {
      start += step;
      if (start >= overallPct) { setDisplayPct(overallPct); clearInterval(timer); }
      else setDisplayPct(Math.round(start));
    }, 24);
    const delay = setTimeout(() => {}, 600);
    return () => { clearInterval(timer); clearTimeout(delay); };
  }, [overallPct]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.void }}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: Spacing.page.horizontal,
          paddingBottom: Spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.md,
        }}>
        <SpringButton onPress={() => safeBack('/(tabs)')} scaleDown={0.88}>
          <View style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: theme.colors.glass,
            borderWidth: 1,
            borderColor: theme.colors.glassBorder,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} />
          </View>
        </SpringButton>
        <Text style={[Typography.headline.xl, { color: theme.colors.textPrimary, flex: 1 }]}>
          Attendance
        </Text>
        <SpringButton scaleDown={0.9}>
          <View style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: theme.colors.glass,
            borderWidth: 1,
            borderColor: theme.colors.glassBorder,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Filter color={theme.colors.textSecondary} size={18} />
          </View>
        </SpringButton>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom, paddingTop: 16 }}>
        {SUBJECTS.length === 0 ? (
          <EmptyState
            title="Attendance Unavailable"
            message="Official attendance records are not currently available. They will appear here once published."
          />
        ) : (
          <>
            {/* ── Hero Ring ── */}
            <Animated.View
              entering={FadeIn.duration(600).delay(100)}
              style={{ alignItems: 'center', paddingVertical: Spacing.xxl }}>
              <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                {/* Glow behind ring */}
                <View style={{
                  position: 'absolute',
                  width: ARC_SIZE * 0.7,
                  height: ARC_SIZE * 0.7,
                  borderRadius: ARC_SIZE * 0.35,
                  backgroundColor: `${overallColor}18`,
                }} />
                <CircularProgress
                  percentage={overallPct}
                  color={overallColor}
                  bg={`${overallColor}20`}
                />
                {/* Center text */}
                <View style={{ position: 'absolute', alignItems: 'center' }}>
                  <Text style={[Typography.display.large, { color: overallColor }]}>
                    {displayPct}%
                  </Text>
                  <Text style={[Typography.label.md, { color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1.5 }]}>
                    Overall
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    gap: 4,
                    marginTop: 8,
                    backgroundColor: theme.colors.primaryMuted,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: Radius.pill,
                  }}>
                    <Text style={[Typography.label.sm, { color: theme.colors.primary }]}>
                      {overallAttended}/{overallTotal} classes
                    </Text>
                  </View>
                </View>
              </View>

              {/* Status badge */}
              <Animated.View entering={FadeInUp.duration(400).delay(700)}>
                {overallPct >= 75 ? (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: Spacing.xl,
                    backgroundColor: theme.colors.successMuted,
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: Radius.pill,
                    borderWidth: 1,
                    borderColor: `${theme.colors.success}30`,
                  }}>
                    <CheckCircle color={theme.colors.success} size={15} />
                    <Text style={[Typography.label.md, { color: theme.colors.success }]}>
                      Safe Zone — Good standing
                    </Text>
                  </View>
                ) : (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: Spacing.xl,
                    backgroundColor: theme.colors.dangerMuted,
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: Radius.pill,
                    borderWidth: 1,
                    borderColor: `${theme.colors.danger}30`,
                  }}>
                    <AlertCircle color={theme.colors.danger} size={15} />
                    <Text style={[Typography.label.md, { color: theme.colors.danger }]}>
                      Low — Attend {Math.ceil((0.75 * overallTotal - overallAttended) / 0.25)} more classes
                    </Text>
                  </View>
                )}
              </Animated.View>
            </Animated.View>

            {/* ── Quick Stats ── */}
            <Animated.View
              entering={FadeInDown.duration(500).delay(300)}
              style={{ paddingHorizontal: Spacing.page.horizontal, gap: 12 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <StatTile
                  label="Present"
                  value={overallAttended}
                  color={theme.colors.success}
                  entering={FadeInLeft.duration(400).delay(350)}
                  icon={<CheckCircle color={theme.colors.success} size={16} />}
                />
                <StatTile
                  label="Absent"
                  value={overallTotal - overallAttended}
                  color={theme.colors.danger}
                  entering={FadeInLeft.duration(400).delay(400)}
                  icon={<XCircle color={theme.colors.danger} size={16} />}
                />
              </View>
            </Animated.View>

            {/* ── Subject Breakdown ── */}
            <Animated.View
              entering={FadeInDown.duration(500).delay(450)}
              style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xxxl }}>
              <SectionHeader title="Subject Breakdown" style={{ marginBottom: Spacing.lg }} />

              <View style={{ gap: 10 }}>
                {SUBJECTS.map((sub, i) => (
                  <SubjectAttendanceRow key={sub.id} subject={sub} index={i} />
                ))}
              </View>
            </Animated.View>

            {/* ── Recent Records ── */}
            <Animated.View
              entering={FadeInDown.duration(500).delay(600)}
              style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xxxl }}>
              <SectionHeader
                title="Recent Records"
                action="View All"
                style={{ marginBottom: Spacing.lg }}
              />
              <GlassCard intensity={12} padding={0} radius={Radius.xl}>
                {RECENT_RECORDS.map((rec, i) => (
                  <View key={i}>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: Spacing.lg,
                      gap: Spacing.md,
                    }}>
                      <View style={{
                        width: 36, height: 36, borderRadius: 18,
                        backgroundColor: rec.status === 'present'
                          ? theme.colors.successMuted
                          : theme.colors.dangerMuted,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {rec.status === 'present'
                          ? <CheckCircle color={theme.colors.success} size={18} />
                          : <XCircle color={theme.colors.danger} size={18} />
                        }
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[Typography.body.md, { color: theme.colors.textPrimary }]}>
                          {rec.subject}
                        </Text>
                        <Text style={[Typography.caption, { color: theme.colors.textTertiary, marginTop: 2 }]}>
                          {rec.date}
                        </Text>
                      </View>
                      <Badge
                        label={rec.status === 'present' ? 'Present' : 'Absent'}
                        color={rec.status === 'present' ? theme.colors.success : theme.colors.danger}
                      />
                    </View>
                    {i < RECENT_RECORDS.length - 1 && (
                      <View style={{ height: 1, backgroundColor: theme.colors.border, marginLeft: 68 }} />
                    )}
                  </View>
                ))}
              </GlassCard>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
