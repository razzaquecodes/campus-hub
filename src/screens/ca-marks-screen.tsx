/**
 * ca-marks-screen.tsx
 *
 * CA Marks — Campus Hub
 *
 * Shows Continuous Assessment marks per subject.
 * UI is fully built and ready to consume backend data.
 * Uses proper empty/loading/error states — no mock marks.
 *
 * Data structure expected from backend:
 *   { subjectName, subjectCode, caMarks, pcaMarks, total, maxMarks }
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
import { useCAMarks } from '@/hooks/queries/use-ca-marks';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SubjectMarks {
  subjectCode: string;
  subjectName: string;
  caMarks: number | null;   // Continuous Assessment
  pcaMarks: number | null;  // Practical / Project CA
  total: number | null;
  maxMarks: number;         // typically 30 or 50
  semester?: string;
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <View style={sk.row}>
      <View style={sk.rowLeft}>
        <Skeleton width={160} height={14} radius={6} />
        <Skeleton width={80} height={11} radius={5} />
      </View>
      <View style={sk.rowRight}>
        <Skeleton width={36} height={26} radius={8} />
        <Skeleton width={36} height={26} radius={8} />
        <Skeleton width={36} height={26} radius={8} />
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowLeft: { gap: 6, flex: 1 },
  rowRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
});

// ─── Subject Marks Row ────────────────────────────────────────────────────────
function SubjectRow({
  item,
  index,
}: {
  item: SubjectMarks;
  index: number;
}) {
  const { theme } = useTheme();

  const totalPct =
    item.total !== null && item.maxMarks > 0
      ? Math.round((item.total / item.maxMarks) * 100)
      : null;

  const pctColor =
    totalPct === null
      ? theme.colors.textTertiary
      : totalPct >= 70
      ? theme.colors.success
      : totalPct >= 50
      ? theme.colors.warning
      : theme.colors.danger;

  const displayVal = (v: number | null) => (v !== null ? String(v) : '—');

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
          {totalPct !== null && (
            <Badge
              label={`${totalPct}%`}
              color={pctColor}
              size="sm"
            />
          )}
        </View>

        {/* Marks row */}
        <View
          style={[
            sr.marksRow,
            { borderTopColor: theme.colors.border },
          ]}
        >
          {[
            { label: 'CA', value: displayVal(item.caMarks), color: theme.colors.primaryLight },
            { label: 'PCA', value: displayVal(item.pcaMarks), color: theme.colors.accent },
            { label: 'Total', value: displayVal(item.total), color: pctColor },
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
  marksRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  marksCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
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

export function CAMarksScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const student = useStudentStore((s) => s.student);

  // Use the real query hook
  const { data: rawMarks = [], isLoading, isError, refetch } = useCAMarks();
  
  // Map API data to the screen's expected format
  const marks: SubjectMarks[] = rawMarks.map(m => ({
    subjectCode: m.subjectCode,
    subjectName: m.subjectName,
    caMarks: Number(m.caMarks) || null,
    pcaMarks: Number(m.pcaMarks) || null,
    // Provide fallback for totalMarks vs total
    total: Number(m.totalMarks ?? m.total) || null,
    maxMarks: 100, // Defaulting to 100 or calculate based on data
    semester: m.semester?.toString(),
  }));

  // Semesters logic
  const semesters = React.useMemo(() => {
    const sems = new Set<string>();
    marks.forEach(m => {
      if (m.semester) sems.add(m.semester);
    });
    return Array.from(sems).sort((a, b) => parseInt(a) - parseInt(b));
  }, [marks]);

  const [activeTab, setActiveTab] = useState<string | null>(null);

  React.useEffect(() => {
    if (semesters.length > 0 && !activeTab) {
      setActiveTab(semesters[semesters.length - 1]);
    }
  }, [semesters, activeTab]);

  const filteredMarks = React.useMemo(() => {
    if (!activeTab) return marks;
    return marks.filter(m => m.semester === activeTab);
  }, [marks, activeTab]);

  const [retrying, setRetrying] = useState(false);

  const screenState: ScreenState = isLoading
    ? 'loading'
    : isError
    ? 'error'
    : filteredMarks.length === 0
    ? 'empty'
    : 'data';

  const overallPct =
    screenState === 'data' && filteredMarks.length > 0
      ? Math.round(
          filteredMarks.reduce((sum, m) => {
            const pct =
              m.total !== null && m.maxMarks > 0
                ? (m.total / m.maxMarks) * 100
                : 0;
            return sum + pct;
          }, 0) / filteredMarks.length,
        )
      : null;

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
            CA Marks
          </Text>
          <Text style={[cs.headerSub, { color: theme.colors.textSecondary }]}>
            Continuous Assessment
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
        {/* ── Overall Summary Card (only when there's data) ── */}
        {screenState === 'data' && overallPct !== null && (
          <Animated.View
            entering={FadeInUp.duration(500).delay(100)}
            style={cs.summaryWrap}
          >
            <View
              style={[
                cs.summaryCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  cs.summaryIconWrap,
                  {
                    backgroundColor: `${theme.colors.primaryLight}14`,
                  },
                ]}
              >
                <TrendingUp
                  color={theme.colors.primaryLight}
                  size={22}
                  strokeWidth={2}
                />
              </View>
              <View>
                <Text
                  style={[cs.summaryValue, { color: theme.colors.primaryLight }]}
                >
                  {overallPct}%
                </Text>
                <Text
                  style={[
                    cs.summaryLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Overall Internal
                </Text>
              </View>
              <View style={cs.summaryRight}>
                <Badge
                  label={
                    overallPct >= 70
                      ? 'Good Standing'
                      : overallPct >= 50
                      ? 'Average'
                      : 'Needs Improvement'
                  }
                  color={
                    overallPct >= 70
                      ? theme.colors.success
                      : overallPct >= 50
                      ? theme.colors.warning
                      : theme.colors.danger
                  }
                  size="md"
                />
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── Column Headers (only when data) ── */}
        {screenState === 'data' && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(200)}
            style={cs.columnHeaderRow}
          >
            <Text
              style={[cs.colHeader, { color: theme.colors.textTertiary, flex: 1 }]}
            >
              SUBJECT
            </Text>
            <Text style={[cs.colHeader, { color: theme.colors.textTertiary }]}>
              CA
            </Text>
            <Text style={[cs.colHeader, { color: theme.colors.textTertiary }]}>
              PCA
            </Text>
            <Text style={[cs.colHeader, { color: theme.colors.textTertiary }]}>
              TOTAL
            </Text>
          </Animated.View>
        )}

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
                Could not fetch your CA marks from the server. Please check your
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
                CA Marks Not Yet Available
              </Text>
              <Text
                style={[cs.stateSub, { color: theme.colors.textSecondary }]}
              >
                Your Continuous Assessment marks will appear here once they are
                published by the institute. Check back after your CA examinations.
              </Text>

              {/* Info pills */}
              <View style={cs.infoPills}>
                {[
                  { label: 'CA — Continuous Assessment', color: theme.colors.primaryLight },
                  { label: 'PCA — Practical / Project CA', color: theme.colors.accent },
                ].map((pill) => (
                  <View
                    key={pill.label}
                    style={[
                      cs.infoPill,
                      { backgroundColor: `${pill.color}10`, borderColor: `${pill.color}24` },
                    ]}
                  >
                    <Text style={[cs.infoPillText, { color: pill.color }]}>
                      {pill.label}
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={[cs.emptyNote, { color: theme.colors.textTertiary }]}>
                Data is fetched from the MAKAUT student portal and refreshed
                automatically.
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

  // Summary
  summaryWrap: {},
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 16,
    ...Shadows.cardLight,
  },
  summaryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  summaryRight: {
    flex: 1,
    alignItems: 'flex-end',
  },

  // Column header
  columnHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    gap: 32,
    marginBottom: -4,
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    width: 36,
    textAlign: 'center',
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

  infoPills: { gap: 6, alignItems: 'flex-start', alignSelf: 'stretch' },
  infoPill: {
    borderWidth: 1,
    borderRadius: Radius.circle,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  infoPillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },

  emptyNote: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },

  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
