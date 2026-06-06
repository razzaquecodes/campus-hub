import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Award,
  BookOpen,
  Info
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SpringButton, Skeleton, EmptyState, ErrorState } from '@/components/ui';
import { Radius, Spacing, Shadows } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useResults } from '@/hooks/queries/use-results';
import { calculateBacklogs, BacklogSubject } from '@/utils/academic-insights';

export function BacklogsScreen() {
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

  const { activeCount, clearedCount, activeBacklogs, clearedBacklogs } = useMemo(() => {
    if (!results || results.length === 0) return { activeCount: 0, clearedCount: 0, activeBacklogs: [], clearedBacklogs: [] };
    return calculateBacklogs(results);
  }, [results]);

  // Group active and cleared backlogs by original semester for display
  const groupedBacklogs = useMemo(() => {
    const all = [...activeBacklogs, ...clearedBacklogs];
    const map = new Map<number, BacklogSubject[]>();
    all.forEach(b => {
      if (!map.has(b.originalSemester)) map.set(b.originalSemester, []);
      map.get(b.originalSemester)!.push(b);
    });
    // Sort semesters ascending
    const sortedKeys = Array.from(map.keys()).sort((a, b) => a - b);
    return sortedKeys.map(sem => ({ semester: sem, subjects: map.get(sem)! }));
  }, [activeBacklogs, clearedBacklogs]);

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
          <Text style={[s.headerTitle, { color: theme.colors.textPrimary }]}>Academic Backlogs</Text>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {isLoading && !refreshing && (
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Skeleton width="48%" height={100} radius={Radius.lg} />
              <Skeleton width="48%" height={100} radius={Radius.lg} />
            </View>
            <Skeleton width="100%" height={200} radius={Radius.lg} />
          </View>
        )}

        {isError && !isLoading && (
          <ErrorState 
            title="Failed to Load Backlogs"
            message="We could not fetch your academic records. Please check your connection."
            onRetry={onRefresh}
          />
        )}

        {!isLoading && !isError && results?.length === 0 && (
          <EmptyState 
            title="No Academic Records"
            message="Your semester results are not available yet. We need result data to calculate backlogs."
            actionLabel="Refresh"
            onAction={onRefresh}
          />
        )}

        {!isLoading && !isError && results && results.length > 0 && (
          <>
            {/* Summary Cards */}
            <Animated.View entering={FadeInDown.duration(400).delay(100)} style={s.summaryContainer}>
              <View style={[s.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={[s.iconBox, { backgroundColor: `${theme.colors.danger}15` }]}>
                  <AlertTriangle color={theme.colors.danger} size={20} />
                </View>
                <Text style={[s.summaryVal, { color: theme.colors.textPrimary }]}>{activeCount}</Text>
                <Text style={[s.summaryLab, { color: theme.colors.textSecondary }]}>Active Backlogs</Text>
              </View>
              <View style={[s.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={[s.iconBox, { backgroundColor: `${theme.colors.success}15` }]}>
                  <Award color={theme.colors.success} size={20} />
                </View>
                <Text style={[s.summaryVal, { color: theme.colors.textPrimary }]}>{clearedCount}</Text>
                <Text style={[s.summaryLab, { color: theme.colors.textSecondary }]}>Cleared Backlogs</Text>
              </View>
            </Animated.View>

            {groupedBacklogs.length === 0 ? (
              <EmptyState 
                title="No Backlogs"
                message="You have an excellent academic record! No backlogs detected."
                icon={<CheckCircle2 color={theme.colors.success} size={36} />}
              />
            ) : (
              groupedBacklogs.map((group, gIdx) => (
                <Animated.View key={group.semester} entering={FadeInDown.duration(400).delay(200 + gIdx * 50)} style={s.groupContainer}>
                  <Text style={[s.semesterLabel, { color: theme.colors.textTertiary }]}>SEMESTER {group.semester}</Text>
                  
                  {group.subjects.map((sub) => {
                    const isActive = sub.status === 'Active';
                    return (
                      <View key={sub.subjectCode} style={[s.subjectCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <View style={s.subTop}>
                          <View style={[s.subIcon, { backgroundColor: isActive ? `${theme.colors.danger}15` : `${theme.colors.success}15` }]}>
                            <BookOpen color={isActive ? theme.colors.danger : theme.colors.success} size={18} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[s.subName, { color: theme.colors.textPrimary }]} numberOfLines={1}>{sub.subjectName}</Text>
                            <Text style={[s.subCode, { color: theme.colors.textTertiary }]}>{sub.subjectCode}</Text>
                          </View>
                          <View style={[s.badge, { backgroundColor: isActive ? `${theme.colors.danger}12` : `${theme.colors.success}12`, borderColor: isActive ? `${theme.colors.danger}30` : `${theme.colors.success}30` }]}>
                            <Text style={[s.badgeText, { color: isActive ? theme.colors.danger : theme.colors.success }]}>
                              {isActive ? 'Active Backlog' : 'Cleared ✔'}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={[s.subBottom, { borderTopColor: theme.colors.border }]}>
                          <View style={s.historyHeader}>
                            <Text style={[s.historyLabel, { color: theme.colors.textSecondary }]}>History ({sub.totalAttempts} Attempts)</Text>
                          </View>
                          <View style={s.historyRow}>
                            {sub.history.map((h, i) => (
                              <View key={i} style={s.historyItem}>
                                <Text style={[s.historySem, { color: theme.colors.textTertiary }]}>Sem {h.semester}</Text>
                                <Text style={[s.historyGrade, { color: theme.colors.textPrimary }]}>{h.grade}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </Animated.View>
              ))
            )}
            
            {/* ── Disclaimer Note ── */}
            <Animated.View entering={FadeInDown.duration(400).delay(400)} style={s.disclaimerNote}>
              <Info color={theme.colors.textTertiary} size={14} />
              <Text style={[s.disclaimerText, { color: theme.colors.textTertiary }]}>
                Backlog status is calculated from available MAKAUT result records and may update when new result data becomes available.
              </Text>
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
  
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    ...Shadows.cardLight,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryVal: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  summaryLab: {
    fontSize: 12,
    fontWeight: '600',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
  },

  groupContainer: { gap: 12 },
  semesterLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginLeft: 4,
    marginTop: 8,
  },
  subjectCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.cardLight,
  },
  subTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  subIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subName: {
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  subCode: {
    fontSize: 12,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  subBottom: {
    padding: 12,
    borderTopWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  historyHeader: {
    marginBottom: 8,
  },
  historyLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  historyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.md,
    gap: 6,
  },
  historySem: {
    fontSize: 11,
    fontWeight: '500',
  },
  historyGrade: {
    fontSize: 12,
    fontWeight: '800',
  },
  disclaimerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
});
