/**
 * results-screen.tsx
 *
 * Campus Hub — Phase 3: Results System
 * Displays overall CGPA, SGPA trend graph, and semester history.
 * Infrastructure ready for backend integration.
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
    ArrowLeft,
    Award,
    ChevronRight,
    GraduationCap,
    TrendingUp
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Path, Stop, LinearGradient as SvgGradient } from 'react-native-svg';

import { Badge, EmptyState, ErrorState, Skeleton, SpringButton } from '@/components/ui';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useResults } from '@/hooks/queries/use-results';
import { useStudentStore } from '@/store/student.store';
import { safeBack } from '@/lib/navigation';

const { width: W } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────
interface SemesterSummary {
  semester: number;
  sgpa: number | null;
  totalCredits: number;
  status: 'Published' | 'Processing';
  publishedDate?: string;
}

// ─── Dummy Data (For state design only, removed in prod) ─────────────────────
// The actual component uses empty state by default to follow rules, but we include 
// this purely for rendering the graph infrastructure.


// ─── Svg Graph Component ──────────────────────────────────────────────────────
function SGPAChart({ data }: { data: any[] }) {
  const { theme } = useTheme();
  
  if (!Array.isArray(data)) return null;

  const validData = data
    .map(item => ({ semester: item.semester, sgpa: Number(item.sgpa) }))
    .filter(item => typeof item.sgpa === 'number' && !isNaN(item.sgpa) && item.sgpa > 0);

  console.log('[GRAPH DATA]', data);
  console.log('[VALID GRAPH DATA]', validData);

  if (validData.length === 0) return null;

  const chartW = W - Spacing.page.horizontal * 2 - 32;
  const chartH = 120;
  
  if (chartW <= 0 || chartH <= 0) return null;

  const minVal = 4;
  const maxVal = 10;
  
  // Calculate points
  const points = validData.map((item, i) => {
    const val = item.sgpa;
    const x = validData.length > 1 ? (i / (validData.length - 1)) * chartW : chartW / 2;
    const y = chartH - ((val - minVal) / (maxVal - minVal)) * chartH;
    return { x, y, val, semester: item.semester };
  });

  const pathData = points
    .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
    .join(' ');

  const areaPath = `${pathData} L${chartW},${chartH} L0,${chartH} Z`;

  return (
    <View style={ch.graphContainer}>
      <Svg width={chartW} height={chartH}>
        <Defs>
          <SvgGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.primaryLight} stopOpacity="0.4" />
            <Stop offset="1" stopColor={theme.colors.primaryLight} stopOpacity="0.0" />
          </SvgGradient>
        </Defs>
        <Path d={areaPath} fill="url(#grad)" />
        <Path d={pathData} fill="none" stroke={theme.colors.primaryLight} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r="4" fill={theme.colors.surface} stroke={theme.colors.primaryLight} strokeWidth="2" />
        ))}
      </Svg>
      {/* X-Axis labels */}
      <View style={ch.graphAxis}>
        {points.map((p, i) => (
          <Text key={i} style={[ch.axisLabel, { color: theme.colors.textTertiary }]}>
            S{p.semester}
          </Text>
        ))}
      </View>
    </View>
  );
}

const ch = StyleSheet.create({
  graphContainer: {
    height: 140,
    marginTop: 16,
  },
  graphAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  axisLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});


// ─── Main Screen ──────────────────────────────────────────────────────────────
export function ResultsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const student = useStudentStore((s) => s.student);

  const { data: apiResults = [], isLoading, isError, refetch, isFetching } = useResults();

  // Map API results to local SemesterSummary shape
  const semesters: SemesterSummary[] = (apiResults || []).map((r: any) => ({
    semester: r.semester,
    sgpa: r.sgpa,
    totalCredits: Array.isArray(r.subjects) ? r.subjects.reduce((s: number, sub: any) => s + (Number(sub.credit ?? sub.credits) || 0), 0) : 0,
    status: r.status,
    publishedDate: undefined,
  }));

  // Calculate CGPA
  const cgpa = (() => {
    const valid = semesters.filter(s => s.sgpa !== null && s.sgpa > 0).map(s => s.sgpa as number);
    if (valid.length === 0) return null;
    return valid.reduce((sum, v) => sum + v, 0) / valid.length;
  })();

  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    // when student changes, refetch
    refetch().catch(() => {});
  }, [student?.rollNumber]);

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setRetrying(true);
    refetch().finally(() => setRetrying(false));
  };

  const screenState = isLoading
    ? 'loading'
    : isError
    ? 'error'
    : semesters.length === 0
    ? 'empty'
    : 'data';


  return (
    <View style={[s.root, { backgroundColor: theme.colors.void }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.void} />

      {/* ── Header ── */}
      <Animated.View entering={FadeIn.duration(300)} style={[s.header, { paddingTop: insets.top + 8, backgroundColor: theme.colors.void }]}>
        <SpringButton onPress={() => safeBack('/(tabs)')} scaleDown={0.88}>
          <View style={[s.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: theme.colors.glassBorder }]}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2} />
          </View>
        </SpringButton>

        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: theme.colors.textPrimary }]}>Academic Results</Text>
          <Text style={[s.headerSub, { color: theme.colors.textSecondary }]}>MAKAUT Grade Cards</Text>
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]} refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />}>
        
        {/* ── Data State ── */}
        {screenState === 'data' && (
          <>
            {/* CGPA Summary Card */}
            <Animated.View entering={FadeInUp.duration(500).delay(100)}>
              <LinearGradient
                colors={isDark ? ['#1e1b4b', '#0f172a'] : ['#eef2ff', '#ffffff']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[s.cgpaCard, { borderColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)' }]}
              >
                <View style={s.cgpaLeft}>
                  <View style={[s.cgpaIconWrap, { backgroundColor: theme.colors.primary }]}>
                    <Award color="#fff" size={24} strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={[s.cgpaLabel, { color: theme.colors.textSecondary }]}>Overall CGPA</Text>
                    <Text style={[s.cgpaValue, { color: theme.colors.primaryLight }]}>{cgpa?.toFixed(2) ?? '—'}</Text>
                  </View>
                </View>
                <View style={s.cgpaRight}>
                  <Badge label="First Class" color={theme.colors.success} size="sm" />
                </View>

                {/* Graph */}
                {semesters.filter(s => s.sgpa !== null && s.sgpa > 0).length > 0 && (
                  <View style={s.graphWrapper}>
                    <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginBottom: 8 }]}>SGPA TREND</Text>
                    <SGPAChart data={semesters.filter(s => s.sgpa !== null && s.sgpa > 0).map(s => ({ semester: s.semester, sgpa: s.sgpa as number })).reverse()} />
                  </View>
                )}
              </LinearGradient>
            </Animated.View>

            {/* Semester History */}
            <Animated.View entering={FadeInDown.duration(400).delay(200)}>
              <Text style={[s.sectionTitle, { color: theme.colors.textTertiary }]}>SEMESTER HISTORY</Text>
              <View style={[s.listContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                {semesters.map((sem, idx) => (
                  <SpringButton key={sem.semester} scaleDown={0.97} onPress={() => router.push(`/results/${sem.semester}` as any)}>
                    <View style={[s.semRow, idx < semesters.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
                      <View style={[s.semIcon, { backgroundColor: `${theme.colors.info}15` }]}>
                        <GraduationCap color={theme.colors.info} size={18} />
                      </View>
                      <View style={s.semInfo}>
                        <Text style={[s.semTitle, { color: theme.colors.textPrimary }]}>Semester {sem.semester}</Text>
                        <Text style={[s.semSub, { color: theme.colors.textSecondary }]}>{sem.totalCredits} Credits Earned</Text>
                      </View>
                      <View style={s.semScoreWrap}>
                        <Text style={[s.semScore, { color: theme.colors.primaryLight }]}>
                          {sem.sgpa !== null && sem.sgpa > 0 ? sem.sgpa.toFixed(2) : '—'}
                        </Text>
                        <Text style={[s.semScoreLabel, { color: theme.colors.textTertiary }]}>SGPA</Text>
                      </View>
                      <ChevronRight color={theme.colors.textTertiary} size={16} style={{ marginLeft: 8 }} />
                    </View>
                  </SpringButton>
                ))}
              </View>
            </Animated.View>
          </>
        )}

        {/* ── Empty State ── */}
        {screenState === 'empty' && (
          <Animated.View entering={FadeInDown.duration(500).delay(100)} style={s.stateWrap}>
            <View style={[s.emptyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={[s.emptyIconWrap, { backgroundColor: `${theme.colors.primaryLight}10` }]}>
                <TrendingUp color={theme.colors.primaryLight} size={40} strokeWidth={1.5} />
              </View>
              <Text style={[s.stateTitle, { color: theme.colors.textPrimary }]}>Results Not Published</Text>
              <Text style={[s.stateSub, { color: theme.colors.textSecondary }]}>
                Your semester results have not been published by MAKAUT yet, or are currently being synced to Campus Hub.
              </Text>
              
              <View style={[s.infoPill, { backgroundColor: `${theme.colors.info}10`, borderColor: `${theme.colors.info}24` }]}>
                <Text style={[s.infoPillText, { color: theme.colors.info }]}>CGPA and SGPA will appear here automatically</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── Loading State ── */}
        {screenState === 'loading' && (
          <Animated.View entering={FadeIn.duration(300)} style={s.stateWrap}>
             <View style={{ marginBottom: 20 }}>
               <Skeleton width="100%" height={200} radius={Radius.xl} />
             </View>
             <View style={{ marginBottom: 12 }}>
               <Skeleton width={120} height={16} radius={4} />
             </View>
             <Skeleton width="100%" height={240} radius={Radius.xl} />
          </Animated.View>
        )}

        {/* ── Error State ── */}
        {screenState === 'error' && (
          <ErrorState 
            title="Connection Error" 
            message="Could not fetch your result data. Please check your internet connection and try again." 
            onRetry={handleRetry} 
          />
        )}

        {/* ── Empty State ── */}
        {screenState === 'empty' && (
          <EmptyState 
            title="No Results Found" 
            message="Your semester results are not available yet. Please check back later when they are published."
            actionLabel="Refresh Data"
            onAction={handleRetry}
          />
        )}

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  headerSub: { fontSize: 11, marginTop: 1 },
  scroll: { paddingHorizontal: Spacing.page.horizontal, paddingTop: 16, gap: 24 },

  cgpaCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 20,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16 }, android: { elevation: 8 } }),
  },
  cgpaLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cgpaIconWrap: { width: 48, height: 48, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  cgpaLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  cgpaValue: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  cgpaRight: { position: 'absolute', top: 20, right: 20 },
  graphWrapper: { marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.2)' },

  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.0, textTransform: 'uppercase', marginBottom: 10, paddingHorizontal: 4 },
  listContainer: { borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden' },
  semRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  semIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  semInfo: { flex: 1 },
  semTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },
  semSub: { fontSize: 11.5, marginTop: 2 },
  semScoreWrap: { alignItems: 'flex-end' },
  semScore: { fontSize: 18, fontWeight: '800' },
  semScoreLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  stateWrap: { paddingTop: 16 },
  emptyCard: { borderRadius: Radius.xl, borderWidth: 1, padding: 32, alignItems: 'center', gap: 14 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  infoPill: { borderWidth: 1, borderRadius: Radius.circle, paddingHorizontal: 12, paddingVertical: 6, marginTop: 8 },
  infoPillText: { fontSize: 11.5, fontWeight: '600' },
  errorCard: { borderRadius: Radius.xl, borderWidth: 1, padding: 28, alignItems: 'center', gap: 12 },
  stateTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, textAlign: 'center' },
  stateSub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.lg },
  retryBtnText: { fontSize: 14, fontWeight: '600' },
});
