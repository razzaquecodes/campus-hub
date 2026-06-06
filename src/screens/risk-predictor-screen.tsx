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
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  Activity,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SpringButton, Skeleton, ErrorState } from '@/components/ui';
import { Radius, Spacing, Shadows } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useResults } from '@/hooks/queries/use-results';
import { useInternalMarks } from '@/hooks/queries/use-internal-marks';
import { calculateRiskAnalysis } from '@/utils/risk-predictor';

export function RiskPredictorScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const { data: results, isLoading: isLoadingRes, isError: isErrorRes, refetch: refetchRes } = useResults();
  const { data: marks, isLoading: isLoadingMarks, isError: isErrorMarks, refetch: refetchMarks } = useInternalMarks();
  
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([refetchRes(), refetchMarks()]);
    setRefreshing(false);
  }, [refetchRes, refetchMarks]);

  const riskAnalysis = useMemo(() => {
    if (!results || !marks) return null;
    return calculateRiskAnalysis(results, marks);
  }, [results, marks]);

  const isLoading = isLoadingRes || isLoadingMarks;
  const isError = isErrorRes || isErrorMarks;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return theme.colors.danger;
      case 'Medium': return theme.colors.warning;
      case 'Low': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'High': return <AlertTriangle color={theme.colors.danger} size={24} />;
      case 'Medium': return <AlertCircle color={theme.colors.warning} size={24} />;
      case 'Low': return <ShieldCheck color={theme.colors.success} size={24} />;
      default: return <Activity color={theme.colors.textSecondary} size={24} />;
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
          <Text style={[s.headerTitle, { color: theme.colors.textPrimary }]}>Risk Predictor</Text>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {isLoading && !refreshing && (
          <View style={{ gap: 20 }}>
            <Skeleton width="100%" height={180} radius={Radius.xl} />
            <Skeleton width="100%" height={100} radius={Radius.lg} />
            <Skeleton width="100%" height={100} radius={Radius.lg} />
          </View>
        )}

        {isError && !isLoading && (
          <ErrorState 
            title="Unable to Analyze Risk"
            message="We could not fetch your academic data. Please check your connection."
            onRetry={onRefresh}
          />
        )}

        {!isLoading && !isError && !riskAnalysis && (
          <View style={{ alignItems: 'center', marginTop: 40, padding: 20 }}>
            <AlertCircle color={theme.colors.textSecondary} size={48} />
            <Text style={{ marginTop: 16, fontSize: 16, color: theme.colors.textPrimary, fontWeight: '600' }}>No Data Available</Text>
            <Text style={{ marginTop: 8, fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' }}>
              We need both your semester results and current CA marks to predict risk.
            </Text>
          </View>
        )}

        {!isLoading && !isError && riskAnalysis && (
          <>
            {/* 1. Overall Score Widget */}
            <Animated.View entering={FadeInDown.duration(400).delay(100)}>
              <View style={[s.scoreCard, { backgroundColor: theme.colors.surface, borderColor: getRiskColor(riskAnalysis.overallLevel) }]}>
                <View style={s.scoreTop}>
                  <View style={[s.iconBox, { backgroundColor: `${getRiskColor(riskAnalysis.overallLevel)}15` }]}>
                    {getRiskIcon(riskAnalysis.overallLevel)}
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={[s.scoreNum, { color: getRiskColor(riskAnalysis.overallLevel) }]}>{riskAnalysis.overallScore.toFixed(0)}%</Text>
                    <Text style={[s.scoreLab, { color: theme.colors.textSecondary }]}>Risk Score</Text>
                  </View>
                </View>
                <View style={s.scoreBottom}>
                  <Text style={[s.scoreStatus, { color: getRiskColor(riskAnalysis.overallLevel) }]}>{riskAnalysis.overallLevel} Risk Semester</Text>
                </View>
              </View>
            </Animated.View>

            {/* 2. Smart Warnings */}
            {riskAnalysis.warnings.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400).delay(150)}>
                <Text style={[s.sectionTitle, { color: theme.colors.textTertiary }]}>SMART WARNINGS</Text>
                <View style={{ gap: 10 }}>
                  {riskAnalysis.warnings.map((warning, idx) => (
                    <View key={idx} style={[s.warningCard, { backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)', borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)' }]}>
                      <AlertTriangle color={theme.colors.danger} size={18} />
                      <Text style={[s.warningText, { color: theme.colors.textPrimary }]}>{warning}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* 3. Subject Priority Ranking */}
            <Animated.View entering={FadeInDown.duration(400).delay(200)}>
              <Text style={[s.sectionTitle, { color: theme.colors.textTertiary }]}>SUBJECT PRIORITY RANKING</Text>
              <View style={{ gap: 12 }}>
                {riskAnalysis.subjects.map((sub, idx) => (
                  <View key={sub.subjectCode} style={[s.subCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <View style={s.subTop}>
                      <View style={[s.rankBox, { backgroundColor: `${getRiskColor(sub.riskLevel)}15` }]}>
                        <Text style={[s.rankNum, { color: getRiskColor(sub.riskLevel) }]}>{idx + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.subName, { color: theme.colors.textPrimary }]} numberOfLines={1}>{sub.subjectName}</Text>
                        <Text style={[s.subCode, { color: theme.colors.textTertiary }]}>{sub.subjectCode}</Text>
                      </View>
                      <View style={[s.riskBadge, { backgroundColor: `${getRiskColor(sub.riskLevel)}15`, borderColor: `${getRiskColor(sub.riskLevel)}30` }]}>
                        <Text style={[s.riskBadgeText, { color: getRiskColor(sub.riskLevel) }]}>{sub.riskLevel} Risk</Text>
                      </View>
                    </View>

                    <View style={[s.subBottom, { borderTopColor: theme.colors.border }]}>
                      <View style={s.statBox}>
                        <Text style={[s.statLab, { color: theme.colors.textSecondary }]}>CA Avg</Text>
                        <Text style={[s.statVal, { color: theme.colors.textPrimary }]}>{sub.caAverage !== null ? `${sub.caAverage.toFixed(1)}/25` : 'N/A'}</Text>
                      </View>
                      
                      {sub.isRepeat && (
                        <View style={s.statBox}>
                          <Text style={[s.statLab, { color: theme.colors.textSecondary }]}>Previous</Text>
                          <Text style={[s.statVal, { color: theme.colors.danger }]}>{sub.previousGrade || 'F'}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>
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
  
  scoreCard: { padding: 20, borderRadius: Radius.xl, borderWidth: 1, ...Shadows.cardLight },
  scoreTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  iconBox: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  scoreLab: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  scoreBottom: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 16 },
  scoreStatus: { fontSize: 18, fontWeight: '800' },

  warningCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: Radius.lg, borderWidth: 1, gap: 12 },
  warningText: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },

  subCard: { borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden', ...Shadows.cardLight },
  subTop: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  rankBox: { width: 32, height: 32, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  rankNum: { fontSize: 14, fontWeight: '800' },
  subName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  subCode: { fontSize: 12, fontWeight: '500' },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1 },
  riskBadgeText: { fontSize: 11, fontWeight: '700' },
  
  subBottom: { flexDirection: 'row', padding: 12, borderTopWidth: 1, backgroundColor: 'rgba(0,0,0,0.02)', gap: 24 },
  statBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statLab: { fontSize: 12, fontWeight: '500' },
  statVal: { fontSize: 14, fontWeight: '700' },
});
