import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, FileText, ArrowLeft, Download } from 'lucide-react-native';

import { SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { useStudentStore } from '@/store/student.store';

interface TimetableRecord {
  id: number;
  branch: string;
  semester: string;
  pdf_name: string;
  pdf_url: string;
  uploaded_at: string;
}

// ─── Utility: Derive Branch & Semester ────────────────────────────────────────

function getBranchFromCourse(courseName?: string | null): string {
  if (!courseName) return 'CSE';
  const lower = courseName.toLowerCase();
  if (lower.includes('artificial')) return 'CSE(AI)';
  if (lower.includes('computer science')) return 'CSE';
  if (lower.includes('electronics') || lower.includes('communication')) return 'ECE';
  if (lower.includes('electrical')) return 'EE';
  if (lower.includes('mechanical')) return 'ME';
  if (lower.includes('civil')) return 'CE';
  return 'CSE';
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function StudentTimetableScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const student = useStudentStore((s) => s.student);
  const branch = getBranchFromCourse(student?.courseName);
  const semester = student?.semester;
  
  const [timetable, setTimetable] = useState<TimetableRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimetable = async () => {
    if (!semester) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('timetables')
        .select('*')
        .eq('is_active', true)
        .eq('branch', branch)
        .eq('semester', semester)
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setTimetable(data || null);
    } catch (err: any) {
      console.error('[timetable] Fetch error:', err);
      setError(err.message || 'Failed to load timetable.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [branch, semester]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    fetchTimetable();
  }, [branch, semester]);

  const openPdf = () => {
    if (timetable?.pdf_url) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      Linking.openURL(timetable.pdf_url).catch(() => Alert.alert('Error', 'Could not open the PDF.'));
    }
  };

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      {/* HEADER */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[ss.header, { paddingTop: insets.top + 16 }]}
      >
        <SpringButton onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          router.back();
        }} scaleDown={0.88}>
          <View style={[ss.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: theme.colors.glassBorder }]}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2} />
          </View>
        </SpringButton>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[Typography.display.small, { color: theme.colors.textPrimary }]}>Timetable</Text>
          <Text style={[Typography.body.sm, { color: theme.colors.textSecondary }]}>
            {branch} • {semester ? `Semester ${semester}` : 'Semester Pending Sync'}
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[ss.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={ss.centerContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : error ? (
          <View style={[ss.emptyState, { borderColor: theme.colors.danger, backgroundColor: `${theme.colors.danger}10` }]}>
            <Calendar color={theme.colors.danger} size={32} />
            <Text style={[Typography.body.md, { color: theme.colors.danger, marginTop: 12, textAlign: 'center' }]}>
              {error}
            </Text>
            <SpringButton onPress={onRefresh} scaleDown={0.95}>
              <View style={[ss.retryBtn, { backgroundColor: theme.colors.danger }]}>
                <Text style={[Typography.label.md, { color: '#FFFFFF' }]}>Try Again</Text>
              </View>
            </SpringButton>
          </View>
        ) : !timetable ? (
          <View style={[ss.emptyState, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <Calendar color={theme.colors.textTertiary} size={32} />
            <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 12, textAlign: 'center' }]}>
              {semester 
                ? 'No timetable available for your semester'
                : 'Waiting for academic data sync to identify your semester.'}
            </Text>
          </View>
        ) : (
          <Animated.View entering={FadeInDown.duration(400).delay(100)} layout={Layout}>
            <SpringButton onPress={openPdf} scaleDown={0.97}>
              <View style={[ss.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                
                <View style={[ss.cardBanner, { backgroundColor: `${theme.colors.primaryLight}15` }]}>
                  <Calendar color={theme.colors.primaryLight} size={48} strokeWidth={1.5} />
                </View>

                <View style={ss.cardBody}>
                  <Text style={[Typography.headline.md, { color: theme.colors.textPrimary, textAlign: 'center' }]}>
                    {timetable.branch} - Sem {timetable.semester} Timetable
                  </Text>
                  
                  <View style={[ss.metaBadge, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
                    <FileText color={theme.colors.textSecondary} size={14} />
                    <Text style={[Typography.label.sm, { color: theme.colors.textSecondary, marginLeft: 6 }]} numberOfLines={1}>
                      {timetable.pdf_name}
                    </Text>
                  </View>
                  
                  <Text style={[Typography.body.sm, { color: theme.colors.textTertiary, marginTop: 12 }]}>
                    Uploaded: {new Date(timetable.uploaded_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </Text>
                </View>

                <View style={[ss.cardAction, { backgroundColor: theme.colors.primary }]}>
                  <Text style={[Typography.label.lg, { color: '#FFFFFF', marginRight: 8 }]}>Open Timetable</Text>
                  <Download color="#FFFFFF" size={18} strokeWidth={2.5} />
                </View>
                
              </View>
            </SpringButton>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: Spacing.lg,
    flexGrow: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: Spacing.xl,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    marginTop: Spacing.lg,
    ...Shadows.float,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    ...Shadows.cardLight,
    overflow: 'hidden',
  },
  cardBanner: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginTop: Spacing.lg,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
});
