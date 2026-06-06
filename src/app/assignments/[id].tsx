import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Clock, FileText, UploadCloud, Link as LinkIcon, CheckCircle2, AlertCircle } from 'lucide-react-native';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { GlassCard, SpringButton } from '@/components/ui';
import { useAssignments } from '@/hooks/use-assignments';

export default function AssignmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { assignments } = useAssignments();

  // Find assignment or use a realistic mock if undefined (for demo purposes if launched directly)
  const assignment = assignments.find(a => a.id === id) || {
    id: id || 'demo-1',
    title: 'Design Document for DBMS Project',
    subject_name: 'Database Management Systems',
    description: 'Create a comprehensive design document including ER diagrams, normalized schemas, and functional dependencies for your chosen semester project.',
    due_date: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
    priority: 'high'
  };

  const [status, setStatus] = useState<'pending' | 'submitted' | 'graded'>('pending');
  const [driveLink, setDriveLink] = useState('');
  const [grade] = useState('18/20'); // Mock grade if graded
  const [feedback] = useState('Excellent ER diagram. The normalization could be explained a bit more clearly in Section 3, but overall great work.');

  const getDaysLeft = (dueDate: string) => {
    const diffMs = new Date(dueDate).getTime() - Date.now();
    return Math.ceil(diffMs / 86400000);
  };

  const daysLeft = getDaysLeft(assignment.due_date);
  const isOverdue = daysLeft < 0;

  const handleSubmit = () => {
    if (!driveLink && status === 'pending') {
      Alert.alert('Empty Submission', 'Please paste a drive link or upload a file before submitting.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStatus('submitted');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
        <Animated.View entering={FadeInDown.duration(400)} style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={ss.headerTopRow}>
            <SpringButton onPress={() => router.back()} scaleDown={0.88}>
              <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
                <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
              </GlassCard>
            </SpringButton>
            
            {status === 'pending' ? (
              <View style={[ss.statusBadge, { backgroundColor: isOverdue ? `${theme.colors.danger}15` : `${theme.colors.warning}15` }]}>
                {isOverdue ? <AlertCircle color={theme.colors.danger} size={14} /> : <Clock color={theme.colors.warning} size={14} />}
                <Text style={[Typography.label.md, { color: isOverdue ? theme.colors.danger : theme.colors.warning, marginLeft: 6, fontWeight: '700' }]}>
                  {isOverdue ? 'Overdue' : `${daysLeft} Days Left`}
                </Text>
              </View>
            ) : status === 'submitted' ? (
              <View style={[ss.statusBadge, { backgroundColor: `${theme.colors.info}15` }]}>
                <CheckCircle2 color={theme.colors.info} size={14} />
                <Text style={[Typography.label.md, { color: theme.colors.info, marginLeft: 6, fontWeight: '700' }]}>Submitted</Text>
              </View>
            ) : (
              <View style={[ss.statusBadge, { backgroundColor: `${theme.colors.success}15` }]}>
                <CheckCircle2 color={theme.colors.success} size={14} />
                <Text style={[Typography.label.md, { color: theme.colors.success, marginLeft: 6, fontWeight: '700' }]}>Graded</Text>
              </View>
            )}
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
              
              <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginBottom: 12 }]}>Attachments</Text>
              <TouchableOpacity style={[ss.attachmentTile, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <View style={[ss.attachmentIcon, { backgroundColor: `${theme.colors.danger}15` }]}>
                  <FileText color={theme.colors.danger} size={18} />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[Typography.label.md, { color: theme.colors.textPrimary }]}>Guidelines.pdf</Text>
                  <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginTop: 2 }]}>1.2 MB</Text>
                </View>
              </TouchableOpacity>
            </GlassCard>
          </Animated.View>

          {status === 'graded' && (
            <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ marginTop: Spacing.xl }}>
              <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginBottom: 12 }]}>Faculty Feedback</Text>
              <GlassCard intensity={isDark ? 30 : 60} style={[ss.feedbackCard, { borderColor: theme.colors.success }]}>
                <View style={ss.gradeRow}>
                  <Text style={[Typography.headline.md, { color: theme.colors.textPrimary }]}>Grade Achieved</Text>
                  <Text style={[Typography.display.small, { color: theme.colors.success }]}>{grade}</Text>
                </View>
                <View style={ss.divider} />
                <Text style={[Typography.body.md, { color: theme.colors.textSecondary, lineHeight: 24 }]}>{feedback}</Text>
              </GlassCard>
            </Animated.View>
          )}

          {status === 'pending' && (
            <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ marginTop: Spacing.xl }}>
              <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginBottom: 12 }]}>Your Submission</Text>
              
              <View style={ss.uploadRow}>
                <TouchableOpacity style={[ss.uploadBtn, { borderColor: theme.colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]} onPress={() => Haptics.selectionAsync()}>
                  <UploadCloud color={theme.colors.textSecondary} size={24} />
                  <Text style={[Typography.label.md, { color: theme.colors.textSecondary, marginTop: 8 }]}>Upload PDF</Text>
                </TouchableOpacity>
              </View>

              <View style={ss.orDivider}>
                <View style={[ss.orLine, { backgroundColor: theme.colors.border }]} />
                <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, paddingHorizontal: 12 }]}>OR</Text>
                <View style={[ss.orLine, { backgroundColor: theme.colors.border }]} />
              </View>

              <View style={[ss.linkInputWrap, { borderColor: theme.colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
                <LinkIcon color={theme.colors.textSecondary} size={18} />
                <TextInput 
                  style={[ss.linkInput, { color: theme.colors.textPrimary }]} 
                  placeholder="Paste Google Drive link..." 
                  placeholderTextColor={theme.colors.textTertiary}
                  value={driveLink}
                  onChangeText={setDriveLink}
                />
              </View>

              <SpringButton onPress={handleSubmit} scaleDown={0.96} style={{ marginTop: Spacing.xl }}>
                <View style={[ss.submitBtn, { backgroundColor: theme.colors.primary }]}>
                  <Text style={[Typography.headline.sm, { color: '#fff' }]}>Submit Work</Text>
                </View>
              </SpringButton>
            </Animated.View>
          )}

          {status === 'submitted' && (
            <Animated.View entering={FadeInUp.duration(400)} style={{ marginTop: Spacing.xl, alignItems: 'center', padding: Spacing.xl }}>
              <CheckCircle2 color={theme.colors.info} size={64} />
              <Text style={[Typography.headline.md, { color: theme.colors.textPrimary, marginTop: 16 }]}>Work Submitted</Text>
              <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>Your assignment has been securely delivered to the faculty for review.</Text>
            </Animated.View>
          )}

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
