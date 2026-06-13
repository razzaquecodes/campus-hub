/**
 * semester-result-screen.tsx
 *
 * Campus Hub — Phase 4: Semester Details System
 * Displays detailed subject-wise grades, statistics, and passes for a specific semester.
 */

import { useLocalSearchParams, router } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Award,
  RefreshCw,
} from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
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
import * as Haptics from 'expo-haptics';

import { Skeleton, SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useStudentStore } from '@/store/student.store';
import { API_CONFIG } from '@/config/api';
import { safeBack } from '@/lib/navigation';

interface SubjectGrade {
  code: string;
  name: string;
  credit: number;
  grade: string;
}

interface SemesterData {
  semester: number;
  sgpa: number | null;
  cgpa: number | null;
  subjects: SubjectGrade[];
}

export function SemesterResultScreen() {
  const { semester } = useLocalSearchParams<{ semester: string }>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const student = useStudentStore((s) => s.student);

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [data, setData] = useState<SemesterData | null>(null);
  const [retrying, setRetrying] = useState(false);

  const fetchSemesterData = async () => {
    if (!student?.rollNumber) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setIsError(false);
      const url = `${API_CONFIG.BASE_URL}/student/${student.rollNumber}/results`;
      const response = await fetch(url);
      const text = await response.text();

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid JSON response");
      }

      if (json && json.success && Array.isArray(json.semesters)) {
        // Find specific semester
        const targetSemStr = String(semester);
        const semObj = json.semesters.find((s: any) => String(s.semester) === targetSemStr);

        if (semObj) {
          const subjects = Array.isArray(semObj.subjects) ? semObj.subjects : [];
          const parsedSubjects = subjects.map((sub: any) => ({
            code: sub.subjectCode || sub.code || 'Unknown',
            name: sub.subjectName || sub.name || 'Unknown',
            credit: Number(sub.credit !== undefined ? sub.credit : sub.credits) || 0,
            grade: sub.grade || 'N/A'
          }));

          let parsedSgpa = null;
          if (semObj.sgpa !== null && semObj.sgpa !== undefined && semObj.sgpa !== 'null' && semObj.sgpa !== 'N/A') {
             const num = parseFloat(semObj.sgpa);
             if (!isNaN(num) && num > 0) parsedSgpa = num;
          }

          let parsedCgpa = null;
          if (semObj.cgpa !== null && semObj.cgpa !== undefined && semObj.cgpa !== 'null' && semObj.cgpa !== 'N/A') {
             const num = parseFloat(semObj.cgpa);
             if (!isNaN(num) && num > 0) parsedCgpa = num;
          }

          setData({
            semester: parseInt(semObj.semester, 10) || 0,
            sgpa: parsedSgpa,
            cgpa: parsedCgpa,
            subjects: parsedSubjects,
          });
        } else {
          setData(null);
        }
      } else {
        setData(null);
      }
    } catch (error) {
      console.error("Failed to fetch semester results:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
      setRetrying(false);
    }
  };

  useEffect(() => {
    fetchSemesterData();
  }, [student?.rollNumber, semester]);

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setRetrying(true);
    fetchSemesterData();
  };

  const screenState = isLoading
    ? 'loading'
    : isError
    ? 'error'
    : !data || (data.subjects.length === 0 && data.sgpa === null)
    ? 'empty'
    : 'data';

  // Statistics Computations
  const GRADE_POINTS: Record<string, number> = {
    'O': 10, 'E': 9, 'A': 8, 'B': 7, 'C': 6, 'D': 5, 'F': 0, 'I': 0
  };

  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case 'O': return '#F59E0B'; // Gold
      case 'E': return '#8B5CF6'; // Purple
      case 'A': return theme.colors.info; // Blue
      case 'B': return theme.colors.success; // Green
      case 'C': return theme.colors.warning; // Orange
      case 'D': return theme.colors.danger; // Red
      case 'F': return theme.colors.danger; // Danger
      case 'I': return theme.colors.danger;
      default: return theme.colors.textTertiary;
    }
  };

  let totalCredits = 0;
  let subjectsPassed = 0;
  let subjectsFailed = 0;
  let highestGrade = 'N/A';
  let lowestGrade = 'N/A';

  if (data && data.subjects.length > 0) {
    let maxPoints = -1;
    let minPoints = 11;

    data.subjects.forEach(sub => {
      const g = sub.grade.toUpperCase();
      const pts = GRADE_POINTS[g] ?? -1;

      if (pts !== -1) {
        if (pts > maxPoints) { maxPoints = pts; highestGrade = g; }
        if (pts < minPoints) { minPoints = pts; lowestGrade = g; }
      }

      if (g === 'F' || g === 'I') {
        subjectsFailed++;
      } else {
        subjectsPassed++;
        totalCredits += sub.credit;
      }
    });
    
    // Fallback if no known grades exist
    if (highestGrade === 'N/A' && data.subjects.length > 0) highestGrade = data.subjects[0].grade;
    if (lowestGrade === 'N/A' && data.subjects.length > 0) lowestGrade = data.subjects[0].grade;
  }

  return (
    <View style={[s.root, { backgroundColor: theme.colors.void }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.void} />

      <Animated.View entering={FadeIn.duration(300)} style={[s.header, { paddingTop: insets.top + 8, backgroundColor: theme.colors.void }]}>
        <SpringButton onPress={() => safeBack('/(tabs)')} scaleDown={0.88}>
          <View style={[s.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: theme.colors.glassBorder }]}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2} />
          </View>
        </SpringButton>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: theme.colors.textPrimary }]}>Semester {semester}</Text>
          <Text style={[s.headerSub, { color: theme.colors.textSecondary }]}>Detailed Grade Card</Text>
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}>
        {screenState === 'data' && data && (
          <>
            <Animated.View entering={FadeInDown.duration(400).delay(100)} style={s.summaryCardWrap}>
              <View style={[s.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={[s.summaryItem, { borderRightWidth: 1, borderRightColor: theme.colors.border, borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
                  <Text style={[s.summaryLabel, { color: theme.colors.textTertiary }]}>SGPA</Text>
                  <Text style={[s.summaryValue, { color: theme.colors.primaryLight }]}>{data.sgpa?.toFixed(2) ?? '—'}</Text>
                </View>
                <View style={[s.summaryItem, { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
                  <Text style={[s.summaryLabel, { color: theme.colors.textTertiary }]}>CGPA</Text>
                  <Text style={[s.summaryValue, { color: theme.colors.primaryLight }]}>{data.cgpa?.toFixed(2) ?? '—'}</Text>
                </View>
                <View style={[s.summaryItem, { borderRightWidth: 1, borderRightColor: theme.colors.border }]}>
                  <Text style={[s.summaryLabel, { color: theme.colors.textTertiary }]}>CREDITS EARNED</Text>
                  <Text style={[s.summaryValue, { color: theme.colors.textPrimary }]}>{totalCredits}</Text>
                </View>
                <View style={s.summaryItem}>
                  <Text style={[s.summaryLabel, { color: theme.colors.textTertiary }]}>TOTAL SUBJECTS</Text>
                  <Text style={[s.summaryValue, { color: theme.colors.textPrimary }]}>{data.subjects.length}</Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(200)}>
              <Text style={[s.sectionTitle, { color: theme.colors.textTertiary }]}>STATISTICS</Text>
              <View style={[s.statsGrid, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={s.statCol}>
                  <Text style={[s.statLabel, { color: theme.colors.textSecondary }]}>Pass/Fail</Text>
                  <Text style={[s.statValue, { color: subjectsFailed > 0 ? theme.colors.danger : theme.colors.success }]}>
                    {subjectsPassed} P / {subjectsFailed} F
                  </Text>
                </View>
                <View style={[s.statCol, { borderLeftWidth: 1, borderLeftColor: theme.colors.border }]}>
                  <Text style={[s.statLabel, { color: theme.colors.textSecondary }]}>Highest Grade</Text>
                  <Text style={[s.statValue, { color: getGradeColor(highestGrade) }]}>{highestGrade}</Text>
                </View>
                <View style={[s.statCol, { borderLeftWidth: 1, borderLeftColor: theme.colors.border }]}>
                  <Text style={[s.statLabel, { color: theme.colors.textSecondary }]}>Lowest Grade</Text>
                  <Text style={[s.statValue, { color: getGradeColor(lowestGrade) }]}>{lowestGrade}</Text>
                </View>
              </View>
            </Animated.View>

            {data.subjects.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400).delay(300)}>
                <Text style={[s.sectionTitle, { color: theme.colors.textTertiary }]}>SUBJECT WISE GRADES</Text>
                <View style={[s.listContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  {data.subjects.map((subj, idx) => (
                    <View key={subj.code + idx} style={[s.subjectRow, idx < data.subjects.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
                      <View style={[s.subjIcon, { backgroundColor: `${theme.colors.info}12` }]}>
                        <BookOpen color={theme.colors.info} size={16} />
                      </View>
                      <View style={s.subjInfo}>
                        <Text style={[s.subjName, { color: theme.colors.textPrimary }]} numberOfLines={2}>{subj.name}</Text>
                        <Text style={[s.subjCode, { color: theme.colors.textSecondary }]}>{subj.code} · {subj.credit} Credits</Text>
                      </View>
                      <View style={[s.gradeWrap, { backgroundColor: `${getGradeColor(subj.grade)}15`, borderColor: `${getGradeColor(subj.grade)}30` }]}>
                        <Text style={[s.gradeText, { color: getGradeColor(subj.grade) }]}>{subj.grade}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}
          </>
        )}

        {screenState === 'empty' && (
          <Animated.View entering={FadeInDown.duration(500).delay(100)} style={s.stateWrap}>
            <View style={[s.emptyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={[s.emptyIconWrap, { backgroundColor: `${theme.colors.primaryLight}10` }]}>
                <Award color={theme.colors.primaryLight} size={40} strokeWidth={1.5} />
              </View>
              <Text style={[s.stateTitle, { color: theme.colors.textPrimary }]}>Grade Card Unavailable</Text>
              <Text style={[s.stateSub, { color: theme.colors.textSecondary }]}>
                Details for Semester {semester} are not yet published or have not been synchronized.
              </Text>
            </View>
          </Animated.View>
        )}

        {screenState === 'loading' && (
          <Animated.View entering={FadeIn.duration(300)} style={s.stateWrap}>
             <Skeleton width="100%" height={160} radius={Radius.xl} />
             <View style={{ marginTop: 24, marginBottom: 12 }}>
               <Skeleton width={120} height={16} radius={4} />
             </View>
             <Skeleton width="100%" height={80} radius={Radius.xl} />
             <View style={{ marginTop: 24, marginBottom: 12 }}>
               <Skeleton width={160} height={16} radius={4} />
             </View>
             <Skeleton width="100%" height={300} radius={Radius.xl} />
          </Animated.View>
        )}

        {screenState === 'error' && (
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={s.stateWrap}>
            <View style={[s.errorCard, { backgroundColor: isDark ? 'rgba(248,113,113,0.06)' : 'rgba(220,38,38,0.05)', borderColor: isDark ? 'rgba(248,113,113,0.20)' : 'rgba(220,38,38,0.14)' }]}>
              <AlertCircle color={theme.colors.danger} size={32} strokeWidth={1.8} />
              <Text style={[s.stateTitle, { color: theme.colors.textPrimary }]}>Connection Error</Text>
              <Text style={[s.stateSub, { color: theme.colors.textSecondary }]}>Could not fetch detailed grade card.</Text>
              <SpringButton onPress={handleRetry} scaleDown={0.94}>
                <View style={[s.retryBtn, { backgroundColor: theme.colors.primaryMuted }]}>
                  <RefreshCw color={theme.colors.primaryLight} size={15} strokeWidth={2} />
                  <Text style={[s.retryBtnText, { color: theme.colors.primaryLight }]}>{retrying ? 'Retrying…' : 'Try Again'}</Text>
                </View>
              </SpringButton>
            </View>
          </Animated.View>
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

  summaryCardWrap: {},
  summaryCard: { flexWrap: 'wrap', flexDirection: 'row', borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden', ...Shadows.cardLight },
  summaryItem: { width: '50%', padding: 16, alignItems: 'center', gap: 4 },
  summaryLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  summaryValue: { fontSize: 22, fontWeight: '800' },

  statsGrid: { flexDirection: 'row', borderRadius: Radius.xl, borderWidth: 1, padding: 16, ...Shadows.cardLight },
  statCol: { flex: 1, alignItems: 'center', gap: 6 },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  statValue: { fontSize: 14, fontWeight: '800' },

  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.0, textTransform: 'uppercase', marginBottom: 10, paddingHorizontal: 4 },
  listContainer: { borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden' },
  subjectRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  subjIcon: { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  subjInfo: { flex: 1, gap: 2 },
  subjName: { fontSize: 13.5, fontWeight: '600', letterSpacing: -0.1 },
  subjCode: { fontSize: 11.5 },
  gradeWrap: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  gradeText: { fontSize: 18, fontWeight: '800' },

  stateWrap: { paddingTop: 16 },
  emptyCard: { borderRadius: Radius.xl, borderWidth: 1, padding: 32, alignItems: 'center', gap: 14 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  errorCard: { borderRadius: Radius.xl, borderWidth: 1, padding: 28, alignItems: 'center', gap: 12 },
  stateTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, textAlign: 'center' },
  stateSub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.lg },
  retryBtnText: { fontSize: 14, fontWeight: '600' },
});
