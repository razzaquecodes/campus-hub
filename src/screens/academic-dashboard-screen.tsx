/**
 * academic-dashboard-screen.tsx
 *
 * Campus Hub — Phase 5: Academic Performance Intelligence System
 * Unified analytics crossing Results and Internal Marks data.
 */

import { router } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BarChart2,
  BookOpen,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
} from 'lucide-react-native';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

import { Skeleton, SpringButton, Badge } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useStudentStore } from '@/store/student.store';
import { API_CONFIG } from '@/config/api';
import { useInternalMarks } from '@/hooks/queries/use-internal-marks';
import { useResults } from '@/hooks/queries/use-results';

const { width: W } = Dimensions.get('window');

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface SubjectResult {
  subjectCode: string;
  subjectName: string;
  credit: number;
  grade: string;
  semester: number;
}

interface SemesterResult {
  semester: number;
  sgpa: number | null;
  cgpa: number | null;
  subjects: SubjectResult[];
}

// ─── SVG Trend Graph ──────────────────────────────────────────────────────────
function SGPAChart({ data }: { data: { semester: number, sgpa: number }[] }) {
  const { theme } = useTheme();
  
  if (data.length === 0) return null;

  const chartW = W - Spacing.page.horizontal * 2 - 32;
  const chartH = 120;
  const minVal = 4;
  const maxVal = 10;
  
  const points = data.map((item, i) => {
    const val = item.sgpa;
    const x = data.length > 1 ? (i / (data.length - 1)) * chartW : chartW / 2;
    const y = chartH - ((val - minVal) / (maxVal - minVal)) * chartH;
    return { x, y, val, semester: item.semester };
  });

  const pathData = points
    .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
    .join(' ');

  const areaPath = `${pathData} L${chartW},${chartH} L0,${chartH} Z`;

  return (
    <View style={s.graphContainer}>
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
      <View style={s.graphAxis}>
        {points.map((p, i) => (
          <Text key={i} style={[s.axisLabel, { color: theme.colors.textTertiary }]}>
            S{p.semester}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── Grade Bar Component ──────────────────────────────────────────────────────
function GradeBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={s.gradeBarRow}>
      <Text style={s.gradeBarLabel}>{label}</Text>
      <View style={s.gradeBarTrack}>
        <View style={[s.gradeBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={s.gradeBarCount}>{count}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function AcademicDashboardScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const student = useStudentStore((s) => s.student);

  // Internal Marks Stream
  const { data: internalMarks = [], isLoading: internalLoading, isError: internalError } = useInternalMarks();

  // Results Stream
  const { data: unsortedResults = [], isLoading: resultsLoading, isError: resultsError } = useResults();
  
  // Academic dashboard expects ascending sort, but useResults provides descending sort by default
  const results = useMemo(() => [...unsortedResults].sort((a, b) => a.semester - b.semester), [unsortedResults]);

  const isLoading = internalLoading || resultsLoading;
  const isError = internalError || resultsError;

  // ─── Analytics Engine ──────────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    if (results.length === 0) return null;

    let totalSubjectsAttempted = 0;
    let totalSubjectsPassed = 0;
    let totalBacklogs = 0;
    let totalCreditsEarned = 0;
    let sgpas: number[] = [];
    
    const gradesCount: Record<string, number> = { O: 0, E: 0, A: 0, B: 0, C: 0, D: 0, F: 0, I: 0 };
    const allSubjects: SubjectResult[] = [];

    results.forEach(sem => {
      if (sem.sgpa) sgpas.push(sem.sgpa);
      sem.subjects.forEach(sub => {
        allSubjects.push(sub);
        totalSubjectsAttempted++;
        const g = sub.grade.toUpperCase();
        if (gradesCount[g] !== undefined) gradesCount[g]++;
        
        if (g === 'F' || g === 'I') {
          totalBacklogs++;
        } else {
          totalSubjectsPassed++;
          totalCreditsEarned += sub.credit;
        }
      });
    });

    const averageSgpa = sgpas.length > 0 ? sgpas.reduce((a,b)=>a+b,0)/sgpas.length : 0;
    const highestSgpa = sgpas.length > 0 ? Math.max(...sgpas) : 0;
    const lowestSgpa = sgpas.length > 0 ? Math.min(...sgpas) : 0;

    // Academic Health Score
    let healthScore = 'Average';
    let healthColor: string = theme.colors.warning;
    if (averageSgpa >= 8.5 && totalBacklogs === 0) { healthScore = 'Excellent'; healthColor = theme.colors.primaryLight; }
    else if (averageSgpa >= 7.0 && totalBacklogs <= 1) { healthScore = 'Good'; healthColor = theme.colors.success; }
    else if (totalBacklogs > 2 || averageSgpa < 6.0) { healthScore = 'Needs Improvement'; healthColor = theme.colors.danger; }

    // Subject Performance & Risk Detection
    const GRADE_POINTS: Record<string, number> = { 'O': 10, 'E': 9, 'A': 8, 'B': 7, 'C': 6, 'D': 5, 'F': 0, 'I': 0 };
    let bestSubject = allSubjects[0];
    let worstSubject = allSubjects[0];
    const atRiskSubjects: { subject: SubjectResult, reason: string }[] = [];

    allSubjects.forEach(sub => {
      const pts = GRADE_POINTS[sub.grade.toUpperCase()] ?? -1;
      const bestPts = GRADE_POINTS[bestSubject?.grade.toUpperCase()] ?? -1;
      const worstPts = GRADE_POINTS[worstSubject?.grade.toUpperCase()] ?? 11;

      if (pts > bestPts) bestSubject = sub;
      if (pts < worstPts && pts !== -1) worstSubject = sub;

      // Risk detection crossing Internal Marks
      const internalMatch = internalMarks.find(im => im.subjectCode === sub.subjectCode);
      let isRisk = false;
      let reasons: string[] = [];

      if (['D', 'F', 'I'].includes(sub.grade.toUpperCase())) {
        reasons.push(`Grade ${sub.grade.toUpperCase()}`);
        isRisk = true;
      }

      if (internalMatch) {
        // Average valid CAs (CA is usually out of 25)
        const cas = [internalMatch.ca1, internalMatch.ca2, internalMatch.ca3, internalMatch.ca4].filter(x => x !== null) as number[];
        if (cas.length > 0) {
          const caAvg = cas.reduce((a,b)=>a+b,0)/cas.length;
          if (caAvg < 10) {
            isRisk = true;
            reasons.push('Low CA Average');
          }
        }
        if (internalMatch.pca1 === null && internalMatch.pca2 === null && sub.credit > 2 /* Assume practicals exist for high credit */) {
          isRisk = true;
          reasons.push('Missing PCA');
        }
      }

      if (isRisk) {
        atRiskSubjects.push({ subject: sub, reason: reasons.join(' + ') });
      }
    });

    // Achievements
    const achievements: string[] = [];
    if (highestSgpa >= 8.0) achievements.push("8.0+ SGPA Club");
    if (totalBacklogs === 0 && totalSubjectsAttempted > 0) achievements.push("Clear Record");
    if (gradesCount['O'] > 0) achievements.push("Outstanding Performer");
    if (sgpas.length > 1 && sgpas[sgpas.length-1] > sgpas[sgpas.length-2]) achievements.push("On the Rise");

    return {
      totalSemesters: results.length,
      totalSubjectsAttempted,
      totalSubjectsPassed,
      totalBacklogs,
      totalCreditsEarned,
      averageSgpa, highestSgpa, lowestSgpa,
      gradesCount,
      bestSubject, worstSubject,
      healthScore, healthColor,
      atRiskSubjects,
      achievements,
      trendData: results.filter(r => r.sgpa !== null).map(r => ({ semester: r.semester, sgpa: r.sgpa as number })),
    };
  }, [results, internalMarks, theme.colors]);

  return (
    <View style={[s.root, { backgroundColor: theme.colors.void }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.void} />

      <Animated.View entering={FadeIn.duration(300)} style={[s.header, { paddingTop: insets.top + 8, backgroundColor: theme.colors.void }]}>
        <SpringButton onPress={() => router.back()} scaleDown={0.88}>
          <View style={[s.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: theme.colors.glassBorder }]}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2} />
          </View>
        </SpringButton>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: theme.colors.textPrimary }]}>Academic Dashboard</Text>
          <Text style={[s.headerSub, { color: theme.colors.textSecondary }]}>Performance Intelligence</Text>
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}>
        {isLoading && (
          <Animated.View entering={FadeIn.duration(300)}>
            <Skeleton width="100%" height={160} radius={Radius.xl} />
            <View style={{ marginTop: 20 }}><Skeleton width="100%" height={200} radius={Radius.xl} /></View>
            <View style={{ marginTop: 20 }}><Skeleton width="100%" height={140} radius={Radius.xl} /></View>
          </Animated.View>
        )}

        {isError && !isLoading && (
          <View style={[s.errorCard, { backgroundColor: isDark ? 'rgba(248,113,113,0.06)' : 'rgba(220,38,38,0.05)', borderColor: isDark ? 'rgba(248,113,113,0.20)' : 'rgba(220,38,38,0.14)' }]}>
            <AlertCircle color={theme.colors.danger} size={32} />
            <Text style={[s.stateTitle, { color: theme.colors.textPrimary }]}>Data Sync Failed</Text>
            <Text style={[s.stateSub, { color: theme.colors.textSecondary }]}>Ensure both Results and Internal Marks APIs are available to generate analytics.</Text>
          </View>
        )}

        {!isLoading && !isError && analytics && (
          <>
            {/* ── Health Score ── */}
            <Animated.View entering={FadeInDown.duration(400).delay(100)}>
              <View style={[s.healthCard, { backgroundColor: analytics.healthColor }]}>
                <View style={s.healthLeft}>
                  <Text style={s.healthLabel}>ACADEMIC HEALTH</Text>
                  <Text style={s.healthValue}>{analytics.healthScore}</Text>
                </View>
                <Target color="#fff" size={32} opacity={0.8} />
              </View>
            </Animated.View>

            {/* ── Key Metrics Grid ── */}
            <Animated.View entering={FadeInDown.duration(400).delay(150)} style={s.metricsGrid}>
              <View style={[s.metricBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={[s.metricVal, { color: theme.colors.textPrimary }]}>{analytics.averageSgpa.toFixed(2)}</Text>
                <Text style={[s.metricLab, { color: theme.colors.textSecondary }]}>Avg SGPA</Text>
              </View>
              <View style={[s.metricBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={[s.metricVal, { color: theme.colors.textPrimary }]}>{analytics.totalCreditsEarned}</Text>
                <Text style={[s.metricLab, { color: theme.colors.textSecondary }]}>Credits</Text>
              </View>
              <View style={[s.metricBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={[s.metricVal, { color: analytics.totalBacklogs > 0 ? theme.colors.danger : theme.colors.success }]}>{analytics.totalBacklogs}</Text>
                <Text style={[s.metricLab, { color: theme.colors.textSecondary }]}>Backlogs</Text>
              </View>
            </Animated.View>

            {/* ── Trend Graph ── */}
            {analytics.trendData.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400).delay(200)}>
                <Text style={[s.sectionTitle, { color: theme.colors.textTertiary }]}>PROGRESS TIMELINE</Text>
                <View style={[s.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <SGPAChart data={analytics.trendData} />
                  <View style={s.trendMeta}>
                    <View style={s.trendMetaCol}>
                      <TrendingUp color={theme.colors.success} size={14} />
                      <Text style={[s.trendMetaText, { color: theme.colors.textSecondary }]}>Highest: <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>{analytics.highestSgpa.toFixed(2)}</Text></Text>
                    </View>
                    <View style={s.trendMetaCol}>
                      <TrendingDown color={theme.colors.danger} size={14} />
                      <Text style={[s.trendMetaText, { color: theme.colors.textSecondary }]}>Lowest: <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>{analytics.lowestSgpa.toFixed(2)}</Text></Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* ── Achievements ── */}
            {analytics.achievements.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400).delay(250)}>
                <Text style={[s.sectionTitle, { color: theme.colors.textTertiary }]}>ACHIEVEMENTS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 8 }}>
                  {analytics.achievements.map((ach, idx) => (
                    <View key={idx} style={[s.achievePill, { backgroundColor: `${theme.colors.primaryLight}15`, borderColor: `${theme.colors.primaryLight}30` }]}>
                      <Award color={theme.colors.primaryLight} size={16} />
                      <Text style={[s.achieveText, { color: theme.colors.primaryLight }]}>{ach}</Text>
                    </View>
                  ))}
                </ScrollView>
              </Animated.View>
            )}

            {/* ── Grade Distribution ── */}
            <Animated.View entering={FadeInDown.duration(400).delay(300)}>
              <Text style={[s.sectionTitle, { color: theme.colors.textTertiary }]}>GRADE DISTRIBUTION</Text>
              <View style={[s.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, padding: 20 }]}>
                <GradeBar label="O" count={analytics.gradesCount['O']} total={analytics.totalSubjectsAttempted} color="#F59E0B" />
                <GradeBar label="E" count={analytics.gradesCount['E']} total={analytics.totalSubjectsAttempted} color="#8B5CF6" />
                <GradeBar label="A" count={analytics.gradesCount['A']} total={analytics.totalSubjectsAttempted} color={theme.colors.info} />
                <GradeBar label="B" count={analytics.gradesCount['B']} total={analytics.totalSubjectsAttempted} color={theme.colors.success} />
                <GradeBar label="C" count={analytics.gradesCount['C']} total={analytics.totalSubjectsAttempted} color={theme.colors.warning} />
                <GradeBar label="D" count={analytics.gradesCount['D']} total={analytics.totalSubjectsAttempted} color={theme.colors.danger} />
                <GradeBar label="F/I" count={analytics.gradesCount['F'] + analytics.gradesCount['I']} total={analytics.totalSubjectsAttempted} color={theme.colors.danger} />
              </View>
            </Animated.View>

            {/* ── Risk Detection (Subjects At Risk) ── */}
            {analytics.atRiskSubjects.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400).delay(350)}>
                <View style={s.riskHeaderRow}>
                  <Text style={[s.sectionTitle, { color: theme.colors.textTertiary, marginBottom: 0 }]}>SUBJECTS AT RISK</Text>
                  <View style={[s.riskBadge, { backgroundColor: `${theme.colors.danger}20` }]}>
                    <Text style={[s.riskBadgeText, { color: theme.colors.danger }]}>{analytics.atRiskSubjects.length} flagged</Text>
                  </View>
                </View>
                
                <View style={[s.riskContainer, { borderColor: theme.colors.danger }]}>
                  {analytics.atRiskSubjects.map((item, idx) => (
                    <View key={idx} style={[s.riskItem, idx < analytics.atRiskSubjects.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
                      <View style={[s.riskIcon, { backgroundColor: `${theme.colors.danger}15` }]}>
                        <AlertTriangle color={theme.colors.danger} size={16} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.riskSubjName, { color: theme.colors.textPrimary }]} numberOfLines={1}>{item.subject.subjectName}</Text>
                        <Text style={[s.riskReason, { color: theme.colors.danger }]}>Reason: {item.reason}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* ── Quick Links ── */}
            <View style={{ marginTop: 20 }}>
              <SpringButton onPress={() => router.push('/results')} scaleDown={0.96}>
                <View style={[s.linkBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <BookOpen color={theme.colors.primaryLight} size={20} />
                  <Text style={[s.linkText, { color: theme.colors.textPrimary }]}>View All Semester Results</Text>
                  <ChevronRight color={theme.colors.textTertiary} size={16} />
                </View>
              </SpringButton>
            </View>

          </>
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

  errorCard: { borderRadius: Radius.xl, borderWidth: 1, padding: 28, alignItems: 'center', gap: 12 },
  stateTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, textAlign: 'center' },
  stateSub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },

  healthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderRadius: Radius.xl,
    ...Shadows.cardLight,
  },
  healthLeft: { gap: 4 },
  healthLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  healthValue: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },

  metricsGrid: { flexDirection: 'row', gap: 10 },
  metricBox: { flex: 1, borderWidth: 1, borderRadius: Radius.xl, padding: 16, alignItems: 'center', gap: 4, ...Shadows.cardLight },
  metricVal: { fontSize: 22, fontWeight: '800' },
  metricLab: { fontSize: 11, fontWeight: '600' },

  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.0, textTransform: 'uppercase', marginBottom: 10, paddingHorizontal: 4 },
  card: { borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden', ...Shadows.cardLight },
  
  graphContainer: { height: 140, marginTop: 16, paddingHorizontal: 16 },
  graphAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  axisLabel: { fontSize: 10, fontWeight: '600' },

  trendMeta: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.1)', padding: 16, backgroundColor: 'rgba(150,150,150,0.02)' },
  trendMetaCol: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  trendMetaText: { fontSize: 12 },

  achievePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1 },
  achieveText: { fontSize: 12, fontWeight: '700' },

  gradeBarRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  gradeBarLabel: { width: 24, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  gradeBarTrack: { flex: 1, height: 8, backgroundColor: 'rgba(150,150,150,0.1)', borderRadius: 4, overflow: 'hidden' },
  gradeBarFill: { height: 8, borderRadius: 4 },
  gradeBarCount: { width: 24, fontSize: 12, fontWeight: '600', textAlign: 'right' },

  riskHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 4 },
  riskBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  riskBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  riskContainer: { borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden', backgroundColor: 'rgba(239, 68, 68, 0.03)' },
  riskItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  riskIcon: { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  riskSubjName: { fontSize: 13.5, fontWeight: '600', marginBottom: 2 },
  riskReason: { fontSize: 11.5, fontWeight: '500' },

  linkBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: Radius.xl, borderWidth: 1, gap: 12 },
  linkText: { flex: 1, fontSize: 15, fontWeight: '600' },
});
