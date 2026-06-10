import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';

import { useTheme } from '@/context/ThemeContext';
import { useResults } from '@/hooks/queries/use-results';
import { calculateBacklogs } from '@/utils/academic-insights';

export default function ResultsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: results, isLoading } = useResults();

  const { activeCount, clearedCount, activeBacklogs } = useMemo(() => {
    if (!results?.length) {
      return { activeCount: 0, clearedCount: 0, activeBacklogs: [] };
    }
    return calculateBacklogs(results);
  }, [results]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.void }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
    >
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Academic Results</Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Backlog Overview</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.danger }]}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Active Backlogs</Text>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
              {isLoading ? '—' : activeCount}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.success }]}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Cleared</Text>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
              {isLoading ? '—' : clearedCount}
            </Text>
          </View>
        </View>
      </View>

      {activeCount > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Active Backlog Subjects</Text>
          {activeBacklogs.map((backlog) => (
            <View key={backlog.subjectCode} style={[styles.subjectCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View>
                <Text style={[styles.subjectText, { color: theme.colors.textPrimary }]}>{backlog.subjectName}</Text>
                <Text style={[styles.subjectCode, { color: theme.colors.textTertiary }]}>{backlog.subjectCode}</Text>
              </View>
              <Text style={[styles.tagText, { color: theme.colors.danger, backgroundColor: `${theme.colors.danger}15` }]}>Pending</Text>
            </View>
          ))}
        </View>
      )}

      <Pressable
        onPress={() => router.push('/results')}
        style={[styles.linkCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      >
        <Text style={[styles.linkText, { color: theme.colors.primary }]}>View Full Semester Results</Text>
        <ChevronRight color={theme.colors.primary} size={18} />
      </Pressable>

      <Pressable
        onPress={() => router.push('/backlogs')}
        style={[styles.linkCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      >
        <Text style={[styles.linkText, { color: theme.colors.primary }]}>Backlog Timeline & History</Text>
        <ChevronRight color={theme.colors.primary} size={18} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, borderLeftWidth: 4 },
  statLabel: { fontSize: 13, marginBottom: 8, fontWeight: '500' },
  statValue: { fontSize: 24, fontWeight: '700' },
  subjectCard: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
  },
  subjectText: { fontSize: 15, fontWeight: '600' },
  subjectCode: { fontSize: 12, marginTop: 2 },
  tagText: { fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  linkText: { fontSize: 15, fontWeight: '600' },
});
