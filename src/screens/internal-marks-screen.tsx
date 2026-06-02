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

import { Badge, Skeleton, SpringButton } from '@/components/ui';
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

  const displayVal = (v: string | number | null | undefined) => (v != null && v !== '' ? String(v) : '-');

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
          <Text style={[sr.sectionTitle, { color: theme.colors.textSecondary }]}>CA Marks</Text>
          <View style={sr.marksRow}>
            {[
              { label: 'CA', value: displayVal(item.caMarks), color: theme.colors.primaryLight },
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
            { borderTopColor: theme.colors.border, paddingTop: 0, paddingBottom: 16 },
          ]}
        >
          <Text style={[sr.sectionTitle, { color: theme.colors.textSecondary }]}>PCA Marks</Text>
          <View style={sr.marksRow}>
            {[
              { label: 'PCA', value: displayVal(item.pcaMarks), color: theme.colors.accent },
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
    return Array.from(sems).sort((a, b) => parseInt(a) - parseInt(b));
  }, [rawMarks]);

  const [activeTab, setActiveTab] = useState<string | null>(null);

  React.useEffect(() => {
    if (semesters.length > 0 && !activeTab) {
      setActiveTab(semesters[semesters.length - 1]);
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
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            style={cs.stateWrap}
          >
            <View
              style={[
                cs.errorCard,
                {
                  backgroundColor: isDark
                    ? 'rgba(248,113,113,0.06)'
                    : 'rgba(220,38,38,0.05)',
                  borderColor: isDark
                    ? 'rgba(248,113,113,0.20)'
                    : 'rgba(220,38,38,0.14)',
                },
              ]}
            >
              <AlertCircle
                color={theme.colors.danger}
                size={32}
                strokeWidth={1.8}
              />
              <Text style={[cs.stateTitle, { color: theme.colors.textPrimary }]}>
                Unable to Load Marks
              </Text>
              <Text
                style={[cs.stateSub, { color: theme.colors.textSecondary }]}
              >
                Could not fetch your Internal marks from the server. Please check your
                connection and try again.
              </Text>
              <SpringButton onPress={handleRetry} scaleDown={0.94}>
                <View
                  style={[
                    cs.retryBtn,
                    { backgroundColor: theme.colors.primaryMuted },
                  ]}
                >
                  <RefreshCw
                    color={theme.colors.primaryLight}
                    size={15}
                    strokeWidth={2}
                  />
                  <Text
                    style={[
                      cs.retryBtnText,
                      { color: theme.colors.primaryLight },
                    ]}
                  >
                    {retrying ? 'Retrying…' : 'Try Again'}
                  </Text>
                </View>
              </SpringButton>
            </View>
          </Animated.View>
        )}

        {/* ── Empty State ── */}
        {screenState === 'empty' && (
          <Animated.View
            entering={FadeInDown.duration(500).delay(100)}
            style={cs.stateWrap}
          >
            <View
              style={[
                cs.emptyCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  cs.emptyIconWrap,
                  { backgroundColor: `${theme.colors.info}10` },
                ]}
              >
                <BarChart3
                  color={theme.colors.info}
                  size={40}
                  strokeWidth={1.5}
                />
              </View>
              <Text style={[cs.stateTitle, { color: theme.colors.textPrimary }]}>
                Internal Marks Not Available
              </Text>
              <Text
                style={[cs.stateSub, { color: theme.colors.textSecondary }]}
              >
                Your Internal marks for this semester will appear here once they are published.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── Data State — Subject List ── */}
        {screenState === 'data' && (
          <View style={cs.listWrap}>
            {filteredMarks.map((item, idx) => (
              <SubjectRow key={item.subjectCode} item={item} index={idx} />
            ))}
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
