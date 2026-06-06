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
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Clock
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SpringButton, Skeleton, ErrorState } from '@/components/ui';
import { Radius, Spacing, Shadows } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useResults } from '@/hooks/queries/use-results';
import { buildAcademicTimeline, AcademicTimelineEvent } from '@/utils/academic-insights';

export function AcademicTimelineScreen() {
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

  const timelineEvents = useMemo(() => {
    if (!results || results.length === 0) return [];
    return buildAcademicTimeline(results);
  }, [results]);

  const getEventIcon = (type: AcademicTimelineEvent['type']) => {
    switch (type) {
      case 'ResultPublished': return <GraduationCap color={theme.colors.info} size={16} />;
      case 'SGPAAvailable': return <TrendingUp color={theme.colors.primaryLight} size={16} />;
      case 'BacklogDetected': return <AlertCircle color={theme.colors.danger} size={16} />;
      case 'BacklogCleared': return <CheckCircle2 color={theme.colors.success} size={16} />;
      case 'Milestone': return <Clock color={theme.colors.textTertiary} size={16} />;
    }
  };

  const getEventColor = (type: AcademicTimelineEvent['type']) => {
    switch (type) {
      case 'ResultPublished': return theme.colors.info;
      case 'SGPAAvailable': return theme.colors.primaryLight;
      case 'BacklogDetected': return theme.colors.danger;
      case 'BacklogCleared': return theme.colors.success;
      case 'Milestone': return theme.colors.textTertiary;
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
          <Text style={[s.headerTitle, { color: theme.colors.textPrimary }]}>Academic Timeline</Text>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {isLoading && !refreshing && (
          <View style={{ gap: 20 }}>
            <Skeleton width="100%" height={80} radius={Radius.lg} />
            <Skeleton width="100%" height={80} radius={Radius.lg} />
            <Skeleton width="100%" height={80} radius={Radius.lg} />
          </View>
        )}

        {isError && !isLoading && (
          <ErrorState 
            title="Unable to Load Timeline"
            message="We could not fetch your academic timeline records. Please check your connection."
            onRetry={onRefresh}
          />
        )}

        {!isLoading && !isError && timelineEvents.length === 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={s.emptyState}>
            <View style={[s.emptyIcon, { backgroundColor: `${theme.colors.textTertiary}15` }]}>
              <Clock color={theme.colors.textTertiary} size={40} />
            </View>
            <Text style={[s.emptyTitle, { color: theme.colors.textPrimary }]}>No Timeline Events</Text>
            <Text style={[s.emptySub, { color: theme.colors.textSecondary }]}>Your academic history will appear here once results are published.</Text>
          </Animated.View>
        )}

        {!isLoading && !isError && timelineEvents.length > 0 && (
          <View style={s.timelineContainer}>
            {timelineEvents.map((event, idx) => {
              const isLast = idx === timelineEvents.length - 1;
              const color = getEventColor(event.type);
              
              return (
                <Animated.View 
                  key={event.id} 
                  entering={FadeInDown.duration(400).delay(idx * 50)}
                  style={s.eventRow}
                >
                  {/* Left Line & Node */}
                  <View style={s.timelineNodeCol}>
                    <View style={[s.nodeDot, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
                      {getEventIcon(event.type)}
                    </View>
                    {!isLast && <View style={[s.nodeLine, { backgroundColor: theme.colors.border }]} />}
                  </View>

                  {/* Right Content */}
                  <View style={s.contentCol}>
                    <Text style={[s.semesterLabel, { color: theme.colors.textTertiary }]}>Semester {event.semester}</Text>
                    <View style={[s.eventCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                      <Text style={[s.eventTitle, { color: theme.colors.textPrimary }]}>{event.title}</Text>
                      <Text style={[s.eventDesc, { color: theme.colors.textSecondary }]}>{event.description}</Text>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
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
  scroll: { paddingHorizontal: Spacing.page.horizontal, paddingTop: 20, gap: 24 },
  
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
    paddingHorizontal: 32,
  },

  timelineContainer: {
    paddingRight: 8,
  },
  eventRow: {
    flexDirection: 'row',
  },
  timelineNodeCol: {
    alignItems: 'center',
    width: 32,
    marginRight: 16,
  },
  nodeDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
    zIndex: 1,
  },
  contentCol: {
    flex: 1,
    paddingBottom: 32,
  },
  semesterLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    marginBottom: 6,
    marginTop: 6,
  },
  eventCard: {
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    ...Shadows.cardLight,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  eventDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
});
