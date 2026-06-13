import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard, SpringButton } from '@/components/ui';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAssignments } from '@/hooks/use-assignments';
import { safeBack } from '@/lib/navigation';

export default function AssignmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { assignments, toggleComplete } = useAssignments();

  const assignment = assignments.find((a) => a.id === id);
  const getDaysLeft = (dueDate: string) => {
    const diffMs = new Date(dueDate).getTime() - Date.now();
    return Math.ceil(diffMs / 86400000);
  };

  const handleToggleStatus = useCallback(() => {
    if (!assignment) return;
    toggleComplete(assignment.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [assignment, toggleComplete]);

  if (!assignment) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[ss.root, { backgroundColor: theme.colors.void, justifyContent: 'center', alignItems: 'center' }]}> 
          <Text style={[Typography.headline.md, { color: theme.colors.textPrimary }]}>Assignment not found.</Text>
          <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 8 }]}>Return to the assignments list to view available work.</Text>
          <SpringButton onPress={() => safeBack('/(tabs)')} scaleDown={0.96} style={{ marginTop: 24 }}>
            <View style={[ss.submitBtn, { backgroundColor: theme.colors.primary }]}> 
              <Text style={[Typography.headline.sm, { color: '#fff' }]}>Back to Assignments</Text>
            </View>
          </SpringButton>
        </View>
      </KeyboardAvoidingView>
    );
  }

  const daysLeft = assignment ? getDaysLeft(assignment.due_date) : 0;
  const isOverdue = assignment ? daysLeft < 0 : false;
  const isCompleted = assignment?.completed ?? false;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
        <Animated.View entering={FadeInDown.duration(400)} style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={ss.headerTopRow}>
            <SpringButton onPress={() => safeBack('/(tabs)')} scaleDown={0.88}>
              <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
                <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
              </GlassCard>
            </SpringButton>
            
            <View style={[ss.statusBadge, { backgroundColor: isOverdue ? `${theme.colors.danger}15` : `${theme.colors.success}15` }]}> 
              {isOverdue ? <AlertCircle color={theme.colors.danger} size={14} /> : <CheckCircle2 color={theme.colors.success} size={14} />}
              <Text style={[Typography.label.md, { color: isOverdue ? theme.colors.danger : theme.colors.success, marginLeft: 6, fontWeight: '700' }]}> 
                {isOverdue ? 'Overdue' : isCompleted ? 'Completed' : `${daysLeft} Days Left`}
              </Text>
            </View>
          </View>
        </Animated.View>

        <ScrollView contentContainerStyle={[ss.content, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false}>
          
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <View style={[ss.subjectTag, { backgroundColor: `${theme.colors.primary}15` }]}>
              <Text style={[Typography.label.sm, { color: theme.colors.primaryLight, fontWeight: '700' }]}>{assignment.subject_name}</Text>
            </View>
            <Text style={[Typography.display.small, { color: theme.colors.textPrimary, marginTop: 12, letterSpacing: -0.5, lineHeight: 36 }]}> 
              {assignment.title}
            </Text>
            
            <GlassCard intensity={isDark ? 30 : 60} style={[ss.infoCard, { borderColor: theme.colors.border, marginTop: Spacing.xl }]}> 
              <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginBottom: 8 }]}>Description</Text>
              <Text style={[Typography.body.md, { color: theme.colors.textSecondary, lineHeight: 24 }]}>{assignment.description}</Text>
              
              <View style={ss.divider} />
              
              <View style={ss.detailsRow}>
                <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}>Due {new Date(assignment.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}>{assignment.priority.toUpperCase()}</Text>
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ marginTop: Spacing.xl }}>
            <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginBottom: 12 }]}>Status</Text>
            <GlassCard intensity={isDark ? 30 : 60} style={[ss.infoCard, { borderColor: theme.colors.border }]}> 
              <Text style={[Typography.body.md, { color: theme.colors.textSecondary, lineHeight: 24 }]}>
                {isCompleted
                  ? 'This assignment is marked completed in your account. Use the faculty portal for submission confirmation and supporting resources.'
                  : 'This assignment is active. Complete the required work and mark it as finished when you have submitted it through the official faculty channel.'}
              </Text>

              {!isCompleted && (
                <SpringButton onPress={handleToggleStatus} scaleDown={0.96} style={{ marginTop: Spacing.xl }}>
                  <View style={[ss.submitBtn, { backgroundColor: theme.colors.primary }]}> 
                    <Text style={[Typography.headline.sm, { color: '#fff' }]}>Mark as Completed</Text>
                  </View>
                </SpringButton>
              )}
            </GlassCard>
          </Animated.View>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: Spacing.page.horizontal, paddingBottom: Spacing.md },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.pill },
  content: { padding: Spacing.page.horizontal, paddingTop: Spacing.xl },
  subjectTag: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm },
  infoCard: { padding: Spacing.xl, borderRadius: Radius.xl, borderWidth: 1 },
  divider: { height: 1, backgroundColor: 'rgba(150,150,150,0.1)', marginVertical: 16 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  attachmentTile: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: Radius.lg },
  attachmentIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  feedbackCard: { padding: Spacing.xl, borderRadius: Radius.xl, borderWidth: 1 },
  gradeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  uploadRow: { flexDirection: 'row' },
  uploadBtn: { flex: 1, height: 100, borderRadius: Radius.xl, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  orDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  orLine: { flex: 1, height: 1 },
  linkInputWrap: { flexDirection: 'row', alignItems: 'center', height: 56, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: 16 },
  linkInput: { flex: 1, marginLeft: 12, fontSize: 15 },
  submitBtn: { height: 56, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' }
});
