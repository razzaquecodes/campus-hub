import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ResultsScreen() {
  const activeBacklogs = 2;
  const clearedBacklogs = 1;
  const backlogSubjects = ['Mathematics II', 'Engineering Mechanics'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Academic Results</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backlog Overview</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: '#ef4444', borderLeftWidth: 4 }]}>
            <Text style={styles.statLabel}>Active Backlogs</Text>
            <Text style={styles.statValue}>{activeBacklogs}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#22c55e', borderLeftWidth: 4 }]}>
            <Text style={styles.statLabel}>Cleared</Text>
            <Text style={styles.statValue}>{clearedBacklogs}</Text>
          </View>
        </View>
      </View>

      {activeBacklogs > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Backlog Subjects</Text>
          {backlogSubjects.map((subject, index) => (
            <View key={index} style={styles.subjectCard}>
              <Text style={styles.subjectText}>{subject}</Text>
              <Text style={styles.tagText}>Pending</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#0f172a', marginBottom: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#334155', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  statLabel: { fontSize: 13, color: '#64748b', marginBottom: 8, fontWeight: '500' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  subjectCard: {
    backgroundColor: '#fff', padding: 16, borderRadius: 12, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  subjectText: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  tagText: { fontSize: 12, fontWeight: '600', color: '#ef4444', backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }
});