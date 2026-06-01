/**
 * semester-result-screen.tsx
 *
 * Campus Hub — Phase 3: Results System
 * Displays detailed subject-wise grades for a specific semester.
 */

import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  BookOpen,
  Award,
} from 'lucide-react-native';
import React from 'react';
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

import { Badge, SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface SubjectGrade {
  code: string;
  name: string;
  credit: number;
  grade: string; // O, E, A, B, C, D, F, I
  points: number;
}

export function SemesterResultScreen() {
  const { semester } = useLocalSearchParams<{ semester: string }>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Empty data as per requirements: "Do not use fake marks"
  // When connected to a backend, use empty arrays / loading flags to show empty state.
  const subjects: SubjectGrade[] = []; 
  const sgpa: number | null = null as number | null;
  const totalCredits = 0;
  
  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case 'O': return '#8B5CF6'; // Purple
      case 'E': return theme.colors.success;
      case 'A': return theme.colors.info;
      case 'B': return theme.colors.primaryLight;
      case 'C': return theme.colors.warning;
      case 'D': return theme.colors.warning;
      case 'F': return theme.colors.danger;
      case 'I': return theme.colors.danger;
      default: return theme.colors.textTertiary;
    }
  };

  return (
    <View style={[s.root, { backgroundColor: theme.colors.void }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.void} />

      {/* ── Header ── */}
      <Animated.View entering={FadeIn.duration(300)} style={[s.header, { paddingTop: insets.top + 8, backgroundColor: theme.colors.void }]}>
        <SpringButton onPress={() => router.back()} scaleDown={0.88}>
          <View style={[s.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: theme.colors.glassBorder }]}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2} />
          </View>
        </SpringButton>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: theme.colors.textPrimary }]}>Semester {semester}</Text>
          <Text style={[s.headerSub, { color: theme.colors.textSecondary }]}>Grade Card Details</Text>
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}>
        
        {/* Semester Summary */}
        {sgpa !== null && (
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={s.summaryCardWrap}>
            <View style={[s.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={[s.summaryItem, { borderRightWidth: 1, borderRightColor: theme.colors.border }]}>
                <Text style={[s.summaryLabel, { color: theme.colors.textTertiary }]}>SGPA</Text>
                <Text style={[s.summaryValue, { color: theme.colors.primaryLight }]}>{sgpa.toFixed(2)}</Text>
              </View>
              <View style={s.summaryItem}>
                <Text style={[s.summaryLabel, { color: theme.colors.textTertiary }]}>CREDITS EARNED</Text>
                <Text style={[s.summaryValue, { color: theme.colors.textPrimary }]}>{totalCredits}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Subjects List */}
        {subjects.length > 0 ? (
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <Text style={[s.sectionTitle, { color: theme.colors.textTertiary }]}>SUBJECT WISE GRADES</Text>
            <View style={[s.listContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              {subjects.map((subj, idx) => (
                <View key={subj.code} style={[s.subjectRow, idx < subjects.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
                  <View style={[s.subjIcon, { backgroundColor: `${theme.colors.info}12` }]}>
                    <BookOpen color={theme.colors.info} size={16} />
                  </View>
                  <View style={s.subjInfo}>
                    <Text style={[s.subjName, { color: theme.colors.textPrimary }]} numberOfLines={1}>{subj.name}</Text>
                    <Text style={[s.subjCode, { color: theme.colors.textSecondary }]}>{subj.code} · {subj.credit} Credits</Text>
                  </View>
                  <View style={s.gradeWrap}>
                    <Text style={[s.gradeText, { color: getGradeColor(subj.grade) }]}>{subj.grade}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(500).delay(100)} style={s.emptyState}>
            <View style={[s.emptyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={[s.emptyIconWrap, { backgroundColor: `${theme.colors.primaryLight}10` }]}>
                <Award color={theme.colors.primaryLight} size={40} strokeWidth={1.5} />
              </View>
              <Text style={[s.stateTitle, { color: theme.colors.textPrimary }]}>Grade Card Unavailable</Text>
              <Text style={[s.stateSub, { color: theme.colors.textSecondary }]}>
                Details for Semester {semester} are not yet published or haven't been synchronized from the MAKAUT portal.
              </Text>
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
  summaryCard: { flexDirection: 'row', borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden', ...Shadows.cardLight },
  summaryItem: { flex: 1, padding: 16, alignItems: 'center', gap: 4 },
  summaryLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  summaryValue: { fontSize: 24, fontWeight: '800' },

  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.0, textTransform: 'uppercase', marginBottom: 10, paddingHorizontal: 4 },
  listContainer: { borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden' },
  subjectRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  subjIcon: { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  subjInfo: { flex: 1, gap: 2 },
  subjName: { fontSize: 14, fontWeight: '600', letterSpacing: -0.2 },
  subjCode: { fontSize: 11.5 },
  gradeWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(150,150,150,0.08)', alignItems: 'center', justifyContent: 'center' },
  gradeText: { fontSize: 20, fontWeight: '800' },

  emptyState: { paddingTop: 16 },
  emptyCard: { borderRadius: Radius.xl, borderWidth: 1, padding: 32, alignItems: 'center', gap: 14 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  stateTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, textAlign: 'center' },
  stateSub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
