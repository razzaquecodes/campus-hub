/**
 * internal-marks-screen.tsx
 *
 * Internal Marks — Campus Hub
 *
 * Shows Internal assessment marks (CA1, CA2, CA3, CA4, PCA1, PCA2) per subject.
 */

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  BarChart3,
  RefreshCw,
  TrendingUp,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Pressable,
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

import { Badge, Skeleton, SpringButton, EmptyState, ErrorState } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useStudentStore } from '@/store/student.store';
import { useInternalMarks } from '@/hooks/queries/use-internal-marks';
import type { InternalMark } from '@/types/internal-marks';

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <View style={sk.row}>
      <View style={sk.rowLeft}>
        <Skeleton width={160} height={14} radius={6} />
        <Skeleton width={80} height={11} radius={5} />
      </View>
      <View style={sk.rowRight}>
        <Skeleton width={30} height={20} radius={6} />
        <Skeleton width={30} height={20} radius={6} />
        <Skeleton width={30} height={20} radius={6} />
        <Skeleton width={30} height={20} radius={6} />
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  row: {
    padding: 16,
    gap: 12,
  },
  rowLeft: { gap: 6, marginBottom: 12 },
  rowRight: { flexDirection: 'row', gap: 8 },
});

// ─── Subject Marks Row ────────────────────────────────────────────────────────
function SubjectRow({
  item,
  index,
}: {
  item: InternalMark;
  index: number;
}) {
  const { theme } = useTheme();


  const displayVal = (v: string | number | null | undefined) => {
    if (v !== null && v !== undefined && v !== '') {
      return String(v);
    }
    return '-';
  };

  return (
    <Animated.View entering={FadeInDown.duration(380).delay(index * 60 + 300)}>
      <View
        style={[
          sr.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {/* Subject header */}
        <View style={sr.cardHeader}>
          <View
            style={[
              sr.iconWrap,
              { backgroundColor: `${theme.colors.info}12` },
            ]}
          >
            <BookOpen color={theme.colors.info} size={15} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[sr.subjectName, { color: theme.colors.textPrimary }]}
              numberOfLines={1}
            >
              {item.subjectName}
            </Text>
            <Text style={[sr.subjectCode, { color: theme.colors.textTertiary }]}>
              {item.subjectCode}
              {item.teacher ? ` • ${item.teacher}` : ''}
            </Text>
          </View>
        </View>

        {/* CA Marks row */}
        <View
          style={[
            sr.marksContainer,
            { borderTopColor: theme.colors.border },
          ]}
        >
          <Text style={[sr.sectionTitle, { color: theme.colors.textSecondary }]}>CA MARKS</Text>
          <View style={sr.marksRow}>
            {[
              { label: 'CA1', value: displayVal(item.ca1), color: theme.colors.primaryLight },
              { label: 'CA2', value: displayVal(item.ca2), color: theme.colors.primaryLight },
              { label: 'CA3', value: displayVal(item.ca3), color: theme.colors.primaryLight },
              { label: 'CA4', value: displayVal(item.ca4), color: theme.colors.primaryLight },
            ].map((col) => (
              <View key={col.label} style={sr.marksCol}>
                <Text style={[sr.marksValue, { color: col.color }]}>
                  {col.value}
                </Text>
                <Text style={[sr.marksLabel, { color: theme.colors.textTertiary }]}>
                  {col.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* PCA Marks row */}
        <View
          style={[
            sr.marksContainer,
            { borderTopColor: theme.colors.border, paddingTop: 12, paddingBottom: 16 },
          ]}
        >
          <Text style={[sr.sectionTitle, { color: theme.colors.textSecondary }]}>PCA MARKS</Text>
          <View style={[sr.marksRow, { justifyContent: 'flex-start', gap: 24 }]}>
            {[
              { label: 'PCA1', value: displayVal(item.pca1), color: theme.colors.accent },
              { label: 'PCA2', value: displayVal(item.pca2), color: theme.colors.accent },
            ].map((col) => (
              <View key={col.label} style={[sr.marksCol, { flex: 0, minWidth: 60 }]}>
                <Text style={[sr.marksValue, { color: col.color }]}>
                  {col.value}
                </Text>
                <Text style={[sr.marksLabel, { color: theme.colors.textTertiary }]}>
                  {col.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

      </View>
    </Animated.View>
  );
}

const sr = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.cardLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectName: {
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  subjectCode: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  marksContainer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  marksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  marksCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  marksValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  marksLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
type ScreenState = 'loading' | 'empty' | 'error' | 'data';

export function InternalMarksScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const student = useStudentStore((s) => s.student);

  // Use the query hook
  const { data: rawMarks = [], isLoading, isError, refetch } = useInternalMarks();
  
  // Semesters logic
  const semesters = React.useMemo(() => {
    const sems = new Set<string>();
    rawMarks.forEach(m => {
      if (m.semester) sems.add(m.semester);
    });
    return Array.from(sems).sort((a, b) => parseInt(b) - parseInt(a));
  }, [rawMarks]);

  const [activeTab, setActiveTab] = useState<string | null>(null);

  React.useEffect(() => {
    if (semesters.length > 0 && !activeTab) {
      setActiveTab(semesters[0]);
    }
  }, [semesters, activeTab]);

  const filteredMarks = React.useMemo(() => {
    if (!activeTab) return rawMarks;
    return rawMarks.filter(m => m.semester === activeTab);
  }, [rawMarks, activeTab]);

  const [retrying, setRetrying] = useState(false);

  const screenState: ScreenState = isLoading
    ? 'loading'
    : isError
    ? 'error'
    : filteredMarks.length === 0
    ? 'empty'
    : 'data';

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setRetrying(true);
    refetch().finally(() => setRetrying(false));
  };

  return (
    <View style={[cs.root, { backgroundColor: theme.colors.void }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.void}
      />

      {/* ── Header ── */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[
          cs.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: theme.colors.void,
          },
        ]}
      >
        <SpringButton onPress={() => router.back()} scaleDown={0.88}>
          <View
            style={[
              cs.backBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.04)',
                borderColor: theme.colors.glassBorder,
              },
            ]}
          >
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2} />
          </View>
        </SpringButton>

        <View style={{ flex: 1 }}>
          <Text style={[cs.headerTitle, { color: theme.colors.textPrimary }]}>
            Internal Marks
          </Text>
          <Text style={[cs.headerSub, { color: theme.colors.textSecondary }]}>
            Detailed CA & PCA Marks
          </Text>
        </View>

        <Badge
          label={`Sem ${activeTab || (student ? '4' : '—')}`}
          color={theme.colors.primaryLight}
          size="md"
        />
      </Animated.View>

      {/* ── Semester Tabs ── */}
      {semesters.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(50)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={cs.tabsContainer}
          >
            {semesters.map(sem => {
              const isActive = activeTab === sem;
              return (
                <Pressable
                  key={sem}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setActiveTab(sem);
                  }}
                  style={[
                    cs.tab,
                    {
                      backgroundColor: isActive ? theme.colors.primaryLight : 'transparent',
                      borderColor: isActive ? theme.colors.primaryLight : theme.colors.border,
                    }
                  ]}
                >
                  <Text style={[
                    cs.tabText,
                    { color: isActive ? '#fff' : theme.colors.textSecondary, fontWeight: isActive ? '600' : '500' }
                  ]}>
                    Semester {sem}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          cs.scroll,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        {/* ── Loading State ── */}
        {screenState === 'loading' && (
          <Animated.View entering={FadeIn.duration(300)} style={cs.listWrap}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  cs.skeletonCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <SkeletonRow />
              </View>
            ))}
          </Animated.View>
        )}

        {/* ── Error State ── */}
        {screenState === 'error' && (
          <ErrorState 
            title="Unable to Load Marks"
            message="Could not fetch your Internal marks from the server. Please check your connection and try again."
            onRetry={handleRetry}
          />
        )}

        {/* ── Empty State ── */}
        {screenState === 'empty' && (
          <EmptyState 
            title="No Marks Found"
            message={rawMarks.length === 0 ? "You do not have any internal marks published yet." : "No marks found for the selected semester."}
            actionLabel="Refresh Data"
            onAction={handleRetry}
          />
        )}

        {/* ── Data State — Subject List ── */}
        {screenState === 'data' && (
          <View style={cs.listWrap}>
            {filteredMarks.map((item, idx) => {
              return (
                <SubjectRow key={`${item.subjectCode}-${idx}`} item={item} index={idx} />
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const cs = StyleSheet.create({
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },

  scroll: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: 8,
    gap: 12,
  },

  // Tabs
  tabsContainer: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingVertical: 12,
    gap: 10,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
  },

  // List
  listWrap: { gap: 10 },

  // Skeleton
  skeletonCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // States
  stateWrap: { paddingTop: 16 },

  errorCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },

  emptyCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 14,
    ...Shadows.cardLight,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  stateTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  stateSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.circle,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
