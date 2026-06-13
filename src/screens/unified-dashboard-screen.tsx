/**
 * unified-dashboard-screen.tsx
 *
 * Campus Hub — Phase 6: Unified Student Dashboard
 * An intelligent, cached dashboard aggregating Profile, Results, CA, and PCA marks.
 */

import { router } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BellRing,
  ChevronRight,
  Target,
  Zap,
  AlertTriangle,
  Lightbulb,
  Clock,
  FileWarning,
  PieChart,
} from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Skeleton, SpringButton, ErrorState } from '@/components/ui';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useStudentStore } from '@/store/student.store';
import { useAuthStore } from '@/store/auth.store';
import { useInternalMarks } from '@/hooks/queries/use-internal-marks';
import { useResults } from '@/hooks/queries/use-results';
import { calculateRiskAnalysis } from '@/utils/risk-predictor';
import { safeBack } from '@/lib/navigation';



// ─── Main Screen ──────────────────────────────────────────────────────────────
export function UnifiedDashboardScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  

  const profile = useAuthStore((s) => s.profile);

  const { data: results = [], isLoading: resLoading, isError: resError, refetch: refetchRes } = useResults();
  const { data: internalMarks = [], isLoading: intLoading, isError: intError, refetch: refetchInt } = useInternalMarks();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([refetchRes(), refetchInt()]);
    setRefreshing(false);
  }, [refetchRes, refetchInt]);

  const riskAnalysis = useMemo(() => {
    if (!results || !internalMarks || results.length === 0 || internalMarks.length === 0) return null;
    return calculateRiskAnalysis(results, internalMarks);
  }, [results, internalMarks]);

  const isLoading = resLoading || intLoading;
  const isError = resError || intError;

  // ─── Analytics Engine ────────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    if (!results || results.length === 0) return null;

    let totalSubjectsPassed = 0;
    let totalBacklogs = 0;
    let totalCreditsEarned = 0;
    
    const GRADE_POINTS: Record<string, number> = { 'O': 10, 'E': 9, 'A': 8, 'B': 7, 'C': 6, 'D': 5, 'F': 0, 'I': 0 };
    let bestSubjectName = 'N/A';
    let bestPts = -1;

    let processingSemestersCount = 0;

    results.forEach(sem => {
      if (sem.status === 'Processing') processingSemestersCount++;
      
      sem.subjects.forEach(sub => {
        const g = sub.grade.toUpperCase();
        if (g === 'F' || g === 'I') totalBacklogs++;
        else {
          totalSubjectsPassed++;
          totalCreditsEarned += sub.credit;
        }

        const pts = GRADE_POINTS[g] ?? -1;
        if (pts > bestPts) {
          bestPts = pts;
          bestSubjectName = sub.subjectName;
        }
      });
    });

    const validSgpas = results.filter(r => r.sgpa !== null).map(r => r.sgpa as number);
    const averageSgpa = validSgpas.length > 0 ? validSgpas.reduce((a,b)=>a+b,0)/validSgpas.length : 0;
    
    // Overall CGPA
    let overallCgpa = results[0]?.cgpa;
    if (!overallCgpa && validSgpas.length > 0) {
      overallCgpa = averageSgpa; // fallback
    }

    // Academic Health
    let healthStatus = 'Average';
    let healthColor: string = theme.colors.warning;
    if (averageSgpa >= 8.5 && totalBacklogs === 0) { healthStatus = 'Excellent'; healthColor = theme.colors.success; }
    else if (averageSgpa >= 7.0 && totalBacklogs <= 1) { healthStatus = 'Good'; healthColor = theme.colors.info; }
    else if (totalBacklogs > 2 || averageSgpa < 6.0) { healthStatus = 'Needs Improvement'; healthColor = theme.colors.danger; }

    // Insights
    const insights: string[] = [];
    if (validSgpas.length >= 2) {
      const latest = validSgpas[0]; // descending order
      const previous = validSgpas[1];
      if (latest > previous) {
        const pct = ((latest - previous) / previous) * 100;
        insights.push(`Your performance improved by ${pct.toFixed(1)}% compared to the previous semester.`);
      } else if (latest < previous) {
        const pct = ((previous - latest) / previous) * 100;
        insights.push(`Your performance dropped by ${pct.toFixed(1)}% compared to the previous semester.`);
      }
    }
    if (bestSubjectName !== 'N/A') {
      insights.push(`"${bestSubjectName}" is your strongest subject.`);
    }

    // Recommendations & Alerts
    const recommendations: string[] = [];
    const alerts: string[] = [];
    let subjectsRequiringAttention = 0;

    if (processingSemestersCount > 0) alerts.push(`${processingSemestersCount} semester result(s) are unpublished/processing.`);

    const latestSemStr = results[0]?.semester?.toString();
    const currentInternalMarks = internalMarks.filter(im => im.semester === latestSemStr);

    currentInternalMarks.forEach(im => {
      let isRisk = false;
      const cas = [im.ca1, im.ca2, im.ca3, im.ca4].filter(x => x !== null) as number[];
      if (cas.length < 2) {
        alerts.push(`Missing CA Marks in ${im.subjectCode}`);
      } else {
        const avg = cas.reduce((a,b)=>a+b,0)/cas.length;
        if (avg < 10) {
          isRisk = true;
          recommendations.push(`Focus more on ${im.subjectName} (Low CA scores).`);
        }
      }

      if (im.pca1 === null && im.pca2 === null) {
        // Assume practical missing
        alerts.push(`Missing PCA Marks in ${im.subjectCode}`);
      }

      if (isRisk) subjectsRequiringAttention++;
    });

    if (totalBacklogs > 0) {
      insights.push(`${totalBacklogs} subjects currently require backlog clearance.`);
    }

    if (averageSgpa >= 8.0) recommendations.push("You are consistently performing well! Keep up the momentum.");

    return {
      semestersCompleted: validSgpas.length,
      totalSubjectsPassed,
      totalCreditsEarned,
      totalBacklogs,
      healthStatus,
      healthColor,
      latestSgpa: validSgpas[0] ?? null,
      overallCgpa,
      insights,
      recommendations,
      alerts,
      subjectsRequiringAttention,
    };
  }, [results, internalMarks, theme.colors]);

  return (
    <View style={[s.root, { backgroundColor: theme.colors.void }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.void} />

      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={[s.header, { paddingTop: insets.top + 8, backgroundColor: theme.colors.void }]}>
        <SpringButton onPress={() => safeBack('/(tabs)')} scaleDown={0.88}>
          <View style={[s.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: theme.colors.glassBorder }]}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2} />
          </View>
        </SpringButton>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: theme.colors.textPrimary }]}>Unified Dashboard</Text>
          <Text style={[s.headerSub, { color: theme.colors.textSecondary }]}>
            {profile?.full_name ? `${profile.full_name}'s Overview` : 'Student Overview'}
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primaryLight} />
        }
      >
        {isLoading && !refreshing && (
          <Animated.View entering={FadeIn.duration(300)} style={{ gap: 16 }}>
            <Skeleton width="100%" height={100} radius={Radius.xl} />
            <Skeleton width="100%" height={140} radius={Radius.xl} />
            <Skeleton width="100%" height={200} radius={Radius.xl} />
          </Animated.View>
        )}

        {isError && !isLoading && (
          <ErrorState 
            title="Offline or Error"
            message="Check your connection and try fetching data again."
            onRetry={onRefresh}
          />
        )}

        {!isLoading && !isError && analytics && (
          <>
            {/* Quick Stats Row */}
            <Animated.View entering={FadeInDown.duration(400).delay(100)}>
              <View style={[s.statsRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={s.statItem}>
                  <Text style={[s.statVal, { color: theme.colors.textPrimary }]}>{analytics.semestersCompleted}</Text>
                  <Text style={[s.statLab, { color: theme.colors.textSecondary }]}>Semesters</Text>
                </View>
                <View style={[s.statItem, { borderLeftWidth: 1, borderLeftColor: theme.colors.border }]}>
                  <Text style={[s.statVal, { color: theme.colors.textPrimary }]}>{analytics.totalSubjectsPassed}</Text>
                  <Text style={[s.statLab, { color: theme.colors.textSecondary }]}>Passed</Text>
                </View>
                <View style={[s.statItem, { borderLeftWidth: 1, borderLeftColor: theme.colors.border }]}>
                  <Text style={[s.statVal, { color: theme.colors.textPrimary }]}>{analytics.totalCreditsEarned}</Text>
                  <Text style={[s.statLab, { color: theme.colors.textSecondary }]}>Credits</Text>
                </View>
                <View style={[s.statItem, { borderLeftWidth: 1, borderLeftColor: theme.colors.border }]}>
                  <Text style={[s.statVal, { color: analytics.healthColor, fontSize: 13, textTransform: 'uppercase' }]} numberOfLines={1}>
                    {analytics.healthStatus}
                  </Text>
                  <Text style={[s.statLab, { color: theme.colors.textSecondary }]}>Health</Text>
                </View>
              </View>
            </Animated.View>

            {/* Academic Summary Cards */}
            <Animated.View entering={FadeInDown.duration(400).delay(150)} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[s.summaryCard, { flex: 1, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Award color={theme.colors.info} size={20} />
                <View style={{ marginTop: 8 }}>
                  <Text style={[s.summaryVal, { color: theme.colors.textPrimary }]}>{analytics.latestSgpa?.toFixed(2) ?? '—'}</Text>
                  <Text style={[s.summaryLab, { color: theme.colors.textSecondary }]}>Latest SGPA</Text>
                </View>
              </View>
              <View style={[s.summaryCard, { flex: 1, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Target color={theme.colors.primaryLight} size={20} />
                <View style={{ marginTop: 8 }}>
                  <Text style={[s.summaryVal, { color: theme.colors.textPrimary }]}>{analytics.overallCgpa?.toFixed(2) ?? '—'}</Text>
                  <Text style={[s.summaryLab, { color: theme.colors.textSecondary }]}>Overall CGPA</Text>
                </View>
              </View>
            </Animated.View>

            {/* Quick Actions for Insights */}
            <Animated.View entering={FadeInDown.duration(400).delay(180)} style={{ flexDirection: 'row', gap: 12 }}>
              <SpringButton
                onPress={() => router.push('/smart-analytics')}
                scaleDown={0.95}
                style={{ flex: 1 }}
              >
                <View style={[s.actionBtn, { backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.05)', borderColor: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.1)' }]}>
                  <PieChart color={theme.colors.success} size={20} />
                  <Text style={[s.actionBtnText, { color: theme.colors.textPrimary }]}>Analytics</Text>
                </View>
              </SpringButton>

              <SpringButton
                onPress={() => router.push('/academic-timeline')}
                scaleDown={0.95}
                style={{ flex: 1 }}
              >
                <View style={[s.actionBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(79,70,229,0.05)', borderColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(79,70,229,0.1)' }]}>
                  <Clock color={theme.colors.primaryLight} size={20} />
                  <Text style={[s.actionBtnText, { color: theme.colors.textPrimary }]}>Timeline</Text>
                </View>
              </SpringButton>

              <SpringButton
                onPress={() => router.push('/backlogs')}
                scaleDown={0.95}
                style={{ flex: 1 }}
              >
                <View style={[s.actionBtn, { backgroundColor: isDark ? 'rgba(248,113,113,0.08)' : 'rgba(220,38,38,0.05)', borderColor: isDark ? 'rgba(248,113,113,0.2)' : 'rgba(220,38,38,0.1)' }]}>
                  <FileWarning color={theme.colors.danger} size={20} />
                  <Text style={[s.actionBtnText, { color: theme.colors.textPrimary }]}>Backlogs</Text>
                </View>
              </SpringButton>
            </Animated.View>

            {/* Upcoming Alerts */}
            {analytics.alerts.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400).delay(200)}>
                <Text style={[s.sectionTitle, { color: theme.colors.textTertiary }]}>UPCOMING ALERTS</Text>
                <View style={[s.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  {analytics.alerts.map((alert, idx) => (
                    <View key={idx} style={[s.alertRow, idx < analytics.alerts.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
                      <View style={[s.iconBox, { backgroundColor: `${theme.colors.warning}15` }]}>
                        <BellRing color={theme.colors.warning} size={16} />
                      </View>
                      <Text style={[s.alertText, { color: theme.colors.textPrimary }]}>{alert}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Academic Risk Widget */}
            {riskAnalysis && (riskAnalysis.overallLevel === 'High' || riskAnalysis.overallLevel === 'Medium') && (
              <Animated.View entering={FadeInDown.duration(400).delay(220)}>
                <Text style={[s.sectionTitle, { color: theme.colors.textTertiary }]}>ACADEMIC RISK</Text>
                <SpringButton onPress={() => router.push('/risk-predictor')} scaleDown={0.97}>
                  <View style={[
                    s.card, 
                    { 
                      backgroundColor: riskAnalysis.overallLevel === 'High' ? isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)' : isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.05)', 
                      borderColor: riskAnalysis.overallLevel === 'High' ? isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)' : isDark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.2)' 
                    }
                  ]}>
                    <View style={[s.alertRow, { padding: 16 }]}>
                      <View style={[s.iconBox, { backgroundColor: riskAnalysis.overallLevel === 'High' ? `${theme.colors.danger}15` : `${theme.colors.warning}15` }]}>
                        <AlertTriangle color={riskAnalysis.overallLevel === 'High' ? theme.colors.danger : theme.colors.warning} size={20} />
                      </View>
                      <View style={{ flex: 1, paddingLeft: 4 }}>
                        <Text style={[s.alertText, { color: riskAnalysis.overallLevel === 'High' ? theme.colors.danger : theme.colors.warning, fontWeight: '700', fontSize: 16 }]}>
                          {riskAnalysis.overallLevel} Risk Detected
                        </Text>
                        <Text style={[s.stateSub, { color: theme.colors.textSecondary, textAlign: 'left', marginTop: 2 }]}>
                          {riskAnalysis.subjects.filter(s => s.riskLevel === 'High' || s.riskLevel === 'Medium').length} subjects need attention. Tap to view.
                        </Text>
                      </View>
                      <ChevronRight color={theme.colors.textTertiary} size={20} />
                    </View>
                  </View>
                </SpringButton>
              </Animated.View>
            )}

            {/* Academic Insights */}
            {analytics.insights.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400).delay(250)}>
                <Text style={[s.sectionTitle, { color: theme.colors.textTertiary }]}>ACADEMIC INSIGHTS</Text>
                <View style={{ gap: 10 }}>
                  {analytics.insights.map((insight, idx) => (
                    <View key={idx} style={[s.insightCard, { backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(79,70,229,0.05)', borderColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(79,70,229,0.1)' }]}>
                      <Zap color={theme.colors.primaryLight} size={18} />
                      <Text style={[s.insightText, { color: theme.colors.textPrimary }]}>{insight}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Smart Recommendations */}
            {analytics.recommendations.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400).delay(300)}>
                <Text style={[s.sectionTitle, { color: theme.colors.textTertiary }]}>SMART RECOMMENDATIONS</Text>
                <View style={{ gap: 10 }}>
                  {analytics.recommendations.map((rec, idx) => (
                    <View key={idx} style={[s.recCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                      <Lightbulb color={theme.colors.success} size={18} />
                      <Text style={[s.recText, { color: theme.colors.textPrimary }]}>{rec}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

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
  scroll: { paddingHorizontal: Spacing.page.horizontal, paddingTop: 16, gap: 20 },

  statsRow: { flexDirection: 'row', borderRadius: Radius.xl, borderWidth: 1, paddingVertical: 14, ...Shadows.cardLight },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLab: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },

  summaryCard: { padding: 16, borderRadius: Radius.xl, borderWidth: 1, ...Shadows.cardLight },
  summaryVal: { fontSize: 24, fontWeight: '800' },
  summaryLab: { fontSize: 12, fontWeight: '600' },

  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.0, textTransform: 'uppercase', marginBottom: 10, paddingHorizontal: 4 },
  card: { borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden', ...Shadows.cardLight },
  
  alertRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  iconBox: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  alertText: { flex: 1, fontSize: 14, fontWeight: '600' },

  insightCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: Radius.xl, borderWidth: 1, gap: 12 },
  insightText: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },

  recCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: Radius.xl, borderWidth: 1, gap: 12, ...Shadows.cardLight },
  recText: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 20 },

  errorCard: { borderRadius: Radius.xl, borderWidth: 1, padding: 28, alignItems: 'center', gap: 12 },
  stateTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, textAlign: 'center' },
  stateSub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: Radius.xl, borderWidth: 1 },
  actionBtnText: { fontSize: 14, fontWeight: '600' },
});
