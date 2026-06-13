import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, User, FileText, CheckCircle2, ChevronRight, X, Clock } from 'lucide-react-native';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { GlassCard, SpringButton } from '@/components/ui';
import { safeBack } from '@/lib/navigation';

interface Submission {
  id: string;
  studentName: string;
  studentId: string;
  submittedAt: string;
  status: 'pending_review' | 'graded';
  grade?: string;
  feedback?: string;
  fileUrl?: string;
}



export default function FacultyAssignmentReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');

  const handleSelect = (sub: Submission) => {
    Haptics.selectionAsync();
    setSelectedSub(sub);
    setGradeInput(sub.grade || '');
    setFeedbackInput(sub.feedback || '');
  };

  const handleSaveGrade = () => {
    if (!selectedSub) return;
    if (!gradeInput.trim()) {
      Alert.alert('Validation Error', 'Please enter a grade.');
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    setSubmissions(submissions.map(s => 
      s.id === selectedSub.id 
        ? { ...s, status: 'graded', grade: gradeInput, feedback: feedbackInput } 
        : s
    ));
    
    setSelectedSub(null);
  };

  if (selectedSub) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
          <Animated.View entering={FadeInDown.duration(400)} style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}>
            <SpringButton onPress={() => { Haptics.selectionAsync(); setSelectedSub(null); }} scaleDown={0.88}>
              <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
                <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
              </GlassCard>
            </SpringButton>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[Typography.display.small, { color: theme.colors.textPrimary, letterSpacing: -0.5 }]} numberOfLines={1}>
                {selectedSub.studentName}
              </Text>
              <Text style={[Typography.body.md, { color: theme.colors.textSecondary }]}>{selectedSub.studentId}</Text>
            </View>
          </Animated.View>

          <ScrollView contentContainerStyle={[ss.content, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInUp.duration(400)}>
              <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginBottom: 12 }]}>Submitted File</Text>
              <GlassCard intensity={isDark ? 20 : 60} style={[ss.fileCard, { borderColor: theme.colors.border }]}>
                <View style={[ss.fileIconWrap, { backgroundColor: `${theme.colors.danger}15` }]}>
                  <FileText color={theme.colors.danger} size={24} />
                </View>
                <View style={{ marginLeft: 16, flex: 1 }}>
                  <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]}>{selectedSub.fileUrl}</Text>
                  <Text style={[Typography.label.sm, { color: theme.colors.textSecondary, marginTop: 2 }]}>Submitted {selectedSub.submittedAt}</Text>
                </View>
                <SpringButton onPress={() => Alert.alert('File', 'Viewing files will be available with backend integration.')}>
                  <View style={[ss.viewBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <Text style={[Typography.label.md, { color: theme.colors.textPrimary, fontWeight: '700' }]}>View</Text>
                  </View>
                </SpringButton>
              </GlassCard>

              <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginTop: Spacing.xl, marginBottom: 12 }]}>Evaluation</Text>
              <GlassCard intensity={isDark ? 20 : 60} style={[ss.evalCard, { borderColor: theme.colors.border }]}>
                <Text style={[Typography.label.md, { color: theme.colors.textSecondary, marginBottom: 8 }]}>Grade (e.g. 18/20)</Text>
                <TextInput 
                  style={[ss.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]} 
                  placeholder="Enter grade..." 
                  placeholderTextColor={theme.colors.textTertiary}
                  value={gradeInput}
                  onChangeText={setGradeInput}
                />

                <Text style={[Typography.label.md, { color: theme.colors.textSecondary, marginTop: 20, marginBottom: 8 }]}>Feedback Comments</Text>
                <TextInput 
                  style={[ss.textArea, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]} 
                  placeholder="Provide feedback on the submission..." 
                  placeholderTextColor={theme.colors.textTertiary}
                  value={feedbackInput}
                  onChangeText={setFeedbackInput}
                  multiline
                  textAlignVertical="top"
                />
              </GlassCard>

              <SpringButton onPress={handleSaveGrade} scaleDown={0.96} style={{ marginTop: Spacing.xl }}>
                <View style={[ss.saveBtn, { backgroundColor: theme.colors.primary }]}>
                  <Text style={[Typography.headline.sm, { color: '#fff' }]}>Save Evaluation</Text>
                </View>
              </SpringButton>
            </Animated.View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      <Animated.View entering={FadeInDown.duration(400)} style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}>
        <SpringButton onPress={() => safeBack('/faculty')} scaleDown={0.88}>
          <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
          </GlassCard>
        </SpringButton>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[Typography.display.small, { color: theme.colors.textPrimary, letterSpacing: -0.5 }]} numberOfLines={1}>Submissions</Text>
          <Text style={[Typography.body.md, { color: theme.colors.textSecondary }]}>{submissions.filter(s => s.status === 'graded').length} of {submissions.length} Graded</Text>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={[ss.content, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(400)}>
          {submissions.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 40, padding: 20 }}>
              <FileText color={theme.colors.textTertiary} size={48} strokeWidth={1.5} />
              <Text style={[Typography.title.md, { color: theme.colors.textSecondary, marginTop: 16, textAlign: 'center' }]}>
                No Submissions Yet
              </Text>
              <Text style={[Typography.body.sm, { color: theme.colors.textTertiary, marginTop: 8, textAlign: 'center' }]}>
                Students have not submitted their work yet.
              </Text>
            </View>
          ) : (
            submissions.map((sub, i) => (
              <Animated.View key={sub.id} entering={FadeInDown.duration(400).delay(i * 100)} layout={Layout.springify()}>
                <SpringButton scaleDown={0.97} onPress={() => handleSelect(sub)}>
                  <GlassCard intensity={isDark ? 30 : 70} style={[ss.subCard, { borderColor: sub.status === 'graded' ? `${theme.colors.success}30` : theme.colors.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[ss.avatar, { backgroundColor: theme.colors.primaryMuted }]}>
                        <User color={theme.colors.primaryLight} size={16} />
                      </View>
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]}>{sub.studentName}</Text>
                        <Text style={[Typography.label.sm, { color: theme.colors.textSecondary }]}>{sub.studentId}</Text>
                      </View>
                      
                      {sub.status === 'graded' ? (
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[Typography.headline.md, { color: theme.colors.success }]}>{sub.grade}</Text>
                          <Text style={[Typography.label.xs, { color: theme.colors.success, marginTop: 2 }]}>Graded</Text>
                        </View>
                      ) : (
                        <View style={[ss.statusPill, { backgroundColor: `${theme.colors.warning}15` }]}>
                          <Clock color={theme.colors.warning} size={12} />
                          <Text style={[Typography.label.xs, { color: theme.colors.warning, marginLeft: 4, fontWeight: '700' }]}>Pending</Text>
                        </View>
                      )}
                    </View>
                  </GlassCard>
                </SpringButton>
              </Animated.View>
            ))
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.page.horizontal, paddingBottom: Spacing.md },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.page.horizontal, paddingTop: Spacing.xl },
  subCard: { padding: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1, marginBottom: Spacing.md },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  fileCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1 },
  fileIconWrap: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  viewBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.md },
  evalCard: { padding: Spacing.xl, borderRadius: Radius.xl, borderWidth: 1 },
  input: { height: 48, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: 16 },
  textArea: { height: 120, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: 16, paddingTop: 16 },
  saveBtn: { height: 56, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' }
});
