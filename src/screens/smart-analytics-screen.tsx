import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Lightbulb,
  Medal,
  BookOpen,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SpringButton, Skeleton, EmptyState, ErrorState } from '@/components/ui';
import { Radius, Spacing, Shadows } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useResults } from '@/hooks/queries/use-results';
import { generateSmartAnalytics } from '@/utils/smart-analytics';

export function SmartAnalyticsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const { data: results, isLoading, isError, refetch } = useResults();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const analytics = useMemo(() => {
    return generateSmartAnalytics(results || []);
  }, [results]);

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'Improving': return <TrendingUp color={theme.colors.success} size={20} />;
      case 'Declining': return <TrendingDown color={theme.colors.danger} size={20} />;
      default: return <Minus color={theme.colors.textSecondary} size={20} />;
    }
  };
  
  const getTrendColor = (trend: string) => {
    switch(trend) {
      case 'Improving': return theme.colors.success;
      case 'Declining': return theme.colors.danger;
      default: return theme.colors.textSecondary;
    }
  };

  const getHealthColor = (status: string) => {
    switch(status) {
      case 'Excellent': return theme.colors.success;
      case 'Good': return theme.colors.info;
      case 'Needs Attention': return theme.colors.warning;
      case 'Critical': return theme.colors.danger;
      default: return theme.colors.textSecondary;
    }
  };

  return (
    <View style={[s.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* ── Header ── */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[
          s.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <SpringButton onPress={() => router.back()} scaleDown={0.88}>
          <View
            style={[
              s.backBtn,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                borderColor: theme.colors.glassBorder,
              },
            ]}
          >
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2} />
          </View>
        </SpringButton>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: theme.colors.textPrimary }]}>Smart Analytics</Text>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {isLoading && !refreshing && (
          <View style={{ gap: 20 }}>
            <Skeleton width="100%" height={200} radius={Radius.xl} />
            <Skeleton width="100%" height={150} radius={Radius.xl} />
          </View>
        )}

        {isError && !isLoading && (
          <ErrorState 
            title="Analytics Unavailable"
            message="We could not fetch your results data to generate analytics. Please check your connection."
            onRetry={onRefresh}
          />
        )}

        {!isLoading && !isError && (!results || results.length === 0) && (
          <EmptyState 
            title="No Results Data"
            message="Smart Analytics requires at least one published semester result to generate insights."
            actionLabel="Refresh Data"
            onAction={onRefresh}
          />
        )}

        {!isLoading && !isError && results && results.length > 0 && analytics && !analytics.isValid && (
          <EmptyState 
            title="Analytics Unavailable"
            message={analytics.validationMessage || "Your data is incomplete."}
            actionLabel="Refresh Data"
            onAction={onRefresh}
          />
        )}

        {!isLoading && !isError && results && results.length > 0 && analytics && analytics.isValid && (
          <>
            {analytics.hasIncompleteData && (
              <Animated.View entering={FadeInDown.duration(400).delay(50)} style={{ marginBottom: 16 }}>
                <View style={{ backgroundColor: `${theme.colors.warning}15`, padding: 16, borderRadius: Radius.lg, borderWidth: 1, borderColor: `${theme.colors.warning}30`, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <AlertTriangle color={theme.colors.warning} size={20} />
                  <Text style={{ flex: 1, color: theme.colors.textPrimary, fontSize: 13, lineHeight: 18 }}>
                    Some semester records are processing or incomplete. Analytics shown are based only on fully published results.
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* 1. Academic Journey Card */}
            <Animated.View entering={FadeInDown.duration(400).delay(100)}>
              <Text style={[s.sectionTitle, { color: theme.colors.textTertiary }]}>ACADEMIC JOURNEY</Text>
              <View style={[s.journeyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={s.journeyGrid}>
                  <View style={[s.jItem, { borderRightWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.border }]}>
                    <Text style={[s.jVal, { color: theme.colors.textPrimary }]}>{analytics.semestersCompleted}</Text>
                    <Text style={[s.jLab, { color: theme.colors.textSecondary }]}>Semesters</Text>
                  </View>
                  <View style={[s.jItem, { borderBottomWidth: 1, borderColor: theme.colors.border }]}>
                    <Text style={[s.jVal, { color: theme.colors.textPrimary }]}>{analytics.totalSubjects}</Text>
                    <Text style={[s.jLab, { color: theme.colors.textSecondary }]}>Subjects</Text>
                  </View>
                  <View style={[s.jItem, { borderRightWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.border }]}>
                    <Text style={[s.jVal, { color: theme.colors.textPrimary }]}>{analytics.activeBacklogsCount}</Text>
                    <Text style={[s.jLab, { color: theme.colors.textSecondary }]}>Active Backlogs</Text>
                  </View>
                  <View style={[s.jItem, { borderBottomWidth: 1, borderColor: theme.colors.border }]}>
                    <Text style={[s.jVal, { color: theme.colors.textPrimary }]}>{analytics.clearedBacklogsCount}</Text>
                    <Text style={[s.jLab, { color: theme.colors.textSecondary }]}>Cleared Backlogs</Text>
                  </View>
                  <View style={[s.jItem, { borderRightWidth: 1, borderColor: theme.colors.border }]}>
                    <Text style={[s.jVal, { color: theme.colors.textPrimary }]}>{analytics.latestSgpa?.toFixed(2) || '—'}</Text>
                    <Text style={[s.jLab, { color: theme.colors.textSecondary }]}>Latest SGPA</Text>
                  </View>
                  <View style={s.jItem}>
                    <Text style={[s.jVal, { color: theme.colors.textPrimary }]}>{analytics.bestSgpa?.toFixed(2) || '—'}</Text>
                    <Text style={[s.jLab, { color: theme.colors.textSecondary }]}>Best SGPA</Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* 2. Academic Health & Trend */}
            <Animated.View entering={FadeInDown.duration(400).delay(150)} style={s.rowCards}>
              <View style={[s.smallCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={s.cardTopRow}>
                  <Activity color={theme.colors.info} size={18} />
                  <Text style={[s.cardSmTitle, { color: theme.colors.textSecondary }]}>Health Meter</Text>
                </View>
                <Text style={[s.healthVal, { color: getHealthColor(analytics.healthStatus) }]}>{analytics.healthScore}%</Text>
                <Text style={[s.healthStatus, { color: getHealthColor(analytics.healthStatus) }]}>{analytics.healthStatus}</Text>
              </View>
              
              <View style={[s.smallCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={s.cardTopRow}>
                  {getTrendIcon(analytics.performanceTrend)}
                  <Text style={[s.cardSmTitle, { color: theme.colors.textSecondary }]}>Performance</Text>
                </View>
                <Text style={[s.trendVal, { color: getTrendColor(analytics.performanceTrend) }]}>{analytics.performanceTrend}</Text>
                <Text style={[s.trendSub, { color: theme.colors.textTertiary }]}>vs previous sem</Text>
              </View>
            </Animated.View>

            {/* 3. Semester Insights */}
            {analytics.insights.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400).delay(200)}>
                <Text style={[s.sectionTitle, { color: theme.colors.textTertiary }]}>INSIGHTS</Text>
                <View style={{ gap: 10 }}>
                  {analytics.insights.map((insight, idx) => (
                    <View key={idx} style={[s.insightCard, { backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(79,70,229,0.05)', borderColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(79,70,229,0.1)' }]}>
                      <Lightbulb color={theme.colors.primaryLight} size={18} />
                      <Text style={[s.insightText, { color: theme.colors.textPrimary }]}>{insight}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* 4. Subject Improvement Tracker */}
            {analytics.improvements.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400).delay(250)}>
                <Text style={[s.sectionTitle, { color: theme.colors.textTertiary }]}>IMPROVEMENTS</Text>
                <View style={[s.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  {analytics.improvements.map((imp, idx) => (
                    <View key={idx} style={[s.impRow, idx < analytics.improvements.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.impName, { color: theme.colors.textPrimary }]} numberOfLines={1}>{imp.subjectName}</Text>
                        <Text style={[s.impCode, { color: theme.colors.textTertiary }]}>{imp.subjectCode}</Text>
                      </View>
                      <View style={s.impGradeBox}>
                        <Text style={[s.impGrade, { color: theme.colors.textSecondary }]}>{imp.previousGrade}</Text>
                        <ArrowLeft style={{ transform: [{ rotate: '180deg' }] }} color={theme.colors.textSecondary} size={14} />
                        <Text style={[s.impGrade, { color: theme.colors.success }]}>{imp.latestGrade}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* 5. Subject Categories */}
            {analytics.categories.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400).delay(300)}>
                <Text style={[s.sectionTitle, { color: theme.colors.textTertiary }]}>CATEGORIES</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {analytics.categories.map((cat, idx) => {
                    const avgGradePts = cat.totalCredits > 0 ? (cat.gradePoints / cat.totalCredits).toFixed(1) : 'N/A';
                    return (
                      <View key={idx} style={[s.catCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <BookOpen color={theme.colors.primaryLight} size={20} />
                        <View style={{ marginTop: 12 }}>
                          <Text style={[s.catName, { color: theme.colors.textPrimary }]}>{cat.category}</Text>
                          <Text style={[s.catSub, { color: theme.colors.textSecondary }]}>{cat.subjectCount} subjects</Text>
                          <View style={s.catAvgBox}>
                            <Text style={[s.catAvg, { color: theme.colors.textPrimary }]}>{avgGradePts}</Text>
                            <Text style={[s.catAvgLab, { color: theme.colors.textTertiary }]}>Avg Pts</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </Animated.View>
            )}

            {/* 6. Achievement Badges */}
            {analytics.badges.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400).delay(350)}>
                <Text style={[s.sectionTitle, { color: theme.colors.textTertiary }]}>ACHIEVEMENTS</Text>
                <View style={s.badgesWrap}>
                  {analytics.badges.map((badge, idx) => (
                    <View key={idx} style={[s.badgeItem, { backgroundColor: `${theme.colors.warning}15`, borderColor: `${theme.colors.warning}30` }]}>
                      <Medal color={theme.colors.warning} size={16} />
                      <Text style={[s.badgeText, { color: theme.colors.warning }]}>{badge}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* 7. Backlog Timeline */}
            {analytics.backlogs.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400).delay(400)}>
                <Text style={[s.sectionTitle, { color: theme.colors.textTertiary }]}>BACKLOG TIMELINE</Text>
                <View style={{ gap: 16 }}>
                  {analytics.backlogs.map((backlog, idx) => {
                    const isCleared = backlog.status === 'Cleared';
                    return (
                      <View key={idx} style={[s.blCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <View style={s.blTop}>
                          <Text style={[s.blName, { color: theme.colors.textPrimary }]} numberOfLines={1}>{backlog.subjectName}</Text>
                          <Text style={[s.blCode, { color: theme.colors.textTertiary }]}>{backlog.subjectCode}</Text>
                        </View>
                        <View style={[s.blTimeline, { borderTopColor: theme.colors.border }]}>
                          {backlog.history.map((h, i) => (
                            <View key={i} style={s.blNode}>
                              <Text style={[s.blSem, { color: theme.colors.textSecondary }]}>{h.semester}</Text>
                              <ArrowLeft style={{ transform: [{ rotate: '180deg' }] }} color={theme.colors.textTertiary} size={12} />
                              <Text style={[s.blGrade, { color: h.grade === 'F' || h.grade === 'I' ? theme.colors.danger : theme.colors.success }]}>{h.grade}</Text>
                            </View>
                          ))}
                        </View>
                        <View style={s.blStatusLine}>
                          <Text style={[s.blStatusLab, { color: isCleared ? theme.colors.success : theme.colors.danger }]}>
                            Status: {isCleared ? 'Cleared' : 'Active'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
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
    borderBottomWidth: 1,
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
  scroll: { paddingHorizontal: Spacing.page.horizontal, paddingTop: 16, gap: 24 },
  
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.0, textTransform: 'uppercase', marginBottom: 12, paddingHorizontal: 4 },
  
  journeyCard: { borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden', ...Shadows.cardLight },
  journeyGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  jItem: { width: '50%', padding: 16, alignItems: 'center' },
  jVal: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  jLab: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },

  rowCards: { flexDirection: 'row', gap: 12 },
  smallCard: { flex: 1, padding: 16, borderRadius: Radius.xl, borderWidth: 1, ...Shadows.cardLight },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  cardSmTitle: { fontSize: 12, fontWeight: '600' },
  healthVal: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  healthStatus: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
  trendVal: { fontSize: 22, fontWeight: '800' },
  trendSub: { fontSize: 11, marginTop: 4 },

  insightCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: Radius.lg, borderWidth: 1, gap: 12 },
  insightText: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },

  card: { borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden', ...Shadows.cardLight },
  impRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  impName: { fontSize: 14.5, fontWeight: '700', marginBottom: 2 },
  impCode: { fontSize: 12, fontWeight: '500' },
  impGradeBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.03)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  impGrade: { fontSize: 14, fontWeight: '800' },

  catCard: { padding: 16, borderRadius: Radius.lg, borderWidth: 1, width: 140, ...Shadows.cardLight },
  catName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  catSub: { fontSize: 12 },
  catAvgBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  catAvg: { fontSize: 18, fontWeight: '800' },
  catAvgLab: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },

  badgesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  blCard: { borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden', ...Shadows.cardLight },
  blTop: { padding: 16 },
  blName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  blCode: { fontSize: 12, fontWeight: '500' },
  blTimeline: { padding: 16, borderTopWidth: 1, gap: 8 },
  blNode: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  blSem: { fontSize: 13, fontWeight: '600', width: 40 },
  blGrade: { fontSize: 15, fontWeight: '800' },
  blStatusLine: { padding: 12, backgroundColor: 'rgba(0,0,0,0.03)', alignItems: 'flex-end' },
  blStatusLab: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
});
