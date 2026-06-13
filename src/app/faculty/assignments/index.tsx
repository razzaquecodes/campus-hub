import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown, FadeInUp, Layout, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Paperclip, ChevronDown, Trash2, Calendar, BookOpen, Trash, Users } from 'lucide-react-native';

import { GlassCard, SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useFacultyStore, FacultyAssignment } from '@/store/faculty.store';
import type { BranchCode, SectionCode } from '@/types/targeting';
import { safeBack } from '@/lib/navigation';

const BRANCHES: BranchCode[] = ['CSE', 'CE', 'ME', 'EE', 'ECE'];
const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const SECTIONS: SectionCode[] = ['A', 'B', 'C', 'D'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function FacultyAssignmentsWorkspace() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { activeAssignments, createAssignment, deleteAssignment } = useFacultyStore();

  const [mode, setMode] = useState<'manage' | 'create'>('manage');

  // Create Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [dueDateStr, setDueDateStr] = useState('YYYY-MM-DD');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  
  const [isAll, setIsAll] = useState(true);
  const [branch, setBranch] = useState<BranchCode>('CSE');
  const [semester, setSemester] = useState('6');
  const [section, setSection] = useState<SectionCode>('A');

  const estimatedCount = useMemo(() => {
    if (isAll) return 1200;
    let base = 1200;
    base = base / 4;
    if (semester) base = base / 8;
    if (section) base = base / 3;
    return Math.max(12, Math.round(base));
  }, [isAll, branch, semester, section]);

  const handleCreate = () => {
    if (!title.trim() || !description.trim() || !subjectName.trim()) {
      Alert.alert('Validation Error', 'Title, description, and subject are required.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const dateObj = new Date(dueDateStr);
    const validDate = isNaN(dateObj.getTime()) ? new Date(Date.now() + 7 * 86400000) : dateObj;

    createAssignment({
      title,
      description,
      subject_name: subjectName,
      due_date: validDate.toISOString(),
      priority,
      target: {
        isAll,
        branch: isAll ? undefined : branch,
        semester: isAll ? undefined : semester,
        section: isAll ? undefined : section,
      }
    });

    Alert.alert('Success', 'Assignment posted successfully!', [
      { 
        text: 'OK', 
        onPress: () => {
          setMode('manage');
          setTitle('');
          setDescription('');
          setSubjectName('');
        }
      }
    ]);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Assignment', 'Are you sure you want to permanently delete this assignment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          deleteAssignment(id);
        }
      }
    ]);
  };

  const SegmentedControl = ({ options, selected, onSelect, isCapitalize = false }: { options: string[], selected: string, onSelect: (s: any) => void, isCapitalize?: boolean }) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ss.segmentScroll}>
      {options.map((opt) => {
        const active = selected === opt;
        return (
          <TouchableOpacity 
            key={opt}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(opt);
            }}
            style={[
              ss.segmentChip,
              { 
                backgroundColor: active ? theme.colors.primary : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                borderColor: active ? theme.colors.primary : theme.colors.border,
              }
            ]}
          >
            <Text style={[
              Typography.label.md, 
              { color: active ? '#fff' : theme.colors.textSecondary, fontWeight: active ? '700' : '500' },
              isCapitalize && { textTransform: 'capitalize' }
            ]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.duration(400)} style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}>
        <SpringButton onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          safeBack('/faculty');
        }} scaleDown={0.88}>
          <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
          </GlassCard>
        </SpringButton>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[Typography.display.small, { color: theme.colors.textPrimary, letterSpacing: -0.5 }]}>Academic Workspace</Text>
        </View>
      </Animated.View>

      <View style={ss.tabRow}>
        <TouchableOpacity 
          style={[ss.tab, mode === 'manage' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]} 
          onPress={() => {
            Haptics.selectionAsync();
            setMode('manage');
          }}
        >
          <Text style={[Typography.headline.sm, { color: mode === 'manage' ? theme.colors.primary : theme.colors.textSecondary }]}>Manage</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[ss.tab, mode === 'create' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]} 
          onPress={() => {
            Haptics.selectionAsync();
            setMode('create');
          }}
        >
          <Text style={[Typography.headline.sm, { color: mode === 'create' ? theme.colors.primary : theme.colors.textSecondary }]}>Assign Work</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[ss.scroll, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
          
          {mode === 'manage' ? (
            <Animated.View entering={FadeInUp.duration(400)}>
              {activeAssignments.length === 0 ? (
                <View style={[ss.emptyCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                  <BookOpen color={theme.colors.textTertiary} size={32} />
                  <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginTop: 12 }]}>No Active Assignments</Text>
                  <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>You have not assigned any work to your classes recently.</Text>
                </View>
              ) : (
                activeAssignments.map((a, i) => {
                  // Mock submission tracking for premium feel
                  const targetStr = a.target.isAll ? '1200' : '60';
                  const submittedCount = Math.floor(parseInt(targetStr) * 0.75); // 75% submitted

                  return (
                    <Animated.View key={a.id} entering={FadeInDown.duration(400).delay(i * 100)}>
                      <SpringButton scaleDown={0.97} onPress={() => { Haptics.selectionAsync(); router.push(`/faculty/assignments/${a.id}`); }}>
                        <GlassCard intensity={isDark ? 30 : 70} style={[ss.assignmentCard, { borderColor: theme.colors.border }]}>
                          <View style={ss.cardHeader}>
                            <View style={{ flex: 1 }}>
                              <Text style={[Typography.headline.md, { color: theme.colors.textPrimary }]} numberOfLines={1}>{a.title}</Text>
                              <Text style={[Typography.label.md, { color: theme.colors.primary, marginTop: 2 }]}>{a.subject_name}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(a.id)} style={ss.deleteBtn}>
                              <Trash color={theme.colors.danger} size={18} />
                            </TouchableOpacity>
                          </View>
                          <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 10, lineHeight: 20 }]} numberOfLines={2}>{a.description}</Text>
                          
                          <View style={[ss.cardFooter, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                              <View style={[ss.priorityPill, { backgroundColor: a.priority === 'high' || a.priority === 'urgent' ? `${theme.colors.danger}20` : `${theme.colors.info}20` }]}>
                                <Text style={[Typography.label.sm, { color: a.priority === 'high' || a.priority === 'urgent' ? theme.colors.danger : theme.colors.info, textTransform: 'capitalize' }]}>{a.priority}</Text>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Calendar color={theme.colors.textTertiary} size={14} />
                                <Text style={[Typography.label.md, { color: theme.colors.textTertiary, marginLeft: 4 }]}>
                                  {new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Submission Analytics */}
                          <View style={[ss.analyticsBox, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <Text style={[Typography.label.sm, { color: theme.colors.textSecondary }]}>Submissions</Text>
                              <Text style={[Typography.label.sm, { color: theme.colors.textPrimary, fontWeight: '700' }]}>{submittedCount} / {targetStr}</Text>
                            </View>
                            <View style={[ss.progressBarBg, { backgroundColor: theme.colors.border }]}>
                              <View style={[ss.progressBarFill, { width: '75%', backgroundColor: theme.colors.success }]} />
                            </View>
                          </View>
                        </GlassCard>
                      </SpringButton>
                    </Animated.View>
                  );
                })
              )}
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInUp.duration(400)}>
              {/* ── 1. Notion-Style Composer ── */}
              <GlassCard intensity={isDark ? 20 : 60} style={[ss.composerCard, { borderColor: theme.colors.border }]} padding={0}>
                <TextInput
                  style={[ss.titleInput, { color: theme.colors.textPrimary }]}
                  placeholder="Subject (e.g., Physics)"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={subjectName}
                  onChangeText={setSubjectName}
                  maxLength={40}
                />
                <View style={[ss.composerDivider, { backgroundColor: theme.colors.border }]} />
                <TextInput
                  style={[ss.titleInput, { color: theme.colors.textPrimary, fontSize: 18 }]}
                  placeholder="Assignment Title"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={80}
                />
                <View style={[ss.composerDivider, { backgroundColor: theme.colors.border }]} />
                <TextInput
                  style={[ss.bodyInput, { color: theme.colors.textPrimary }]}
                  placeholder="Detailed instructions or questions..."
                  placeholderTextColor={theme.colors.textTertiary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                />
                
                <View style={[ss.composerFooter, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }]}>
                  <SpringButton scaleDown={0.96} onPress={() => Alert.alert('Coming Soon', 'Attachment support will be enabled after backend integration.')}>
                    <View style={[ss.attachmentBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                      <Paperclip color={theme.colors.textSecondary} size={16} />
                      <Text style={[Typography.label.sm, { color: theme.colors.textSecondary, marginLeft: 6 }]}>Attach PDF</Text>
                    </View>
                  </SpringButton>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginRight: 8 }]}>Due Date</Text>
                    <TextInput
                      style={[ss.dateInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={theme.colors.textTertiary}
                      value={dueDateStr}
                      onChangeText={setDueDateStr}
                    />
                  </View>
                </View>
              </GlassCard>

              {/* ── 2. Priority ── */}
              <Animated.View entering={FadeInUp.duration(500).delay(200)} style={{ marginTop: Spacing.xl }}>
                <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginBottom: 12 }]}>Priority</Text>
                <SegmentedControl options={PRIORITIES} selected={priority} onSelect={setPriority} isCapitalize={true} />
              </Animated.View>

              {/* ── 3. Smart Audience Builder ── */}
              <Animated.View entering={FadeInUp.duration(500).delay(300)} style={{ marginTop: Spacing.xl }}>
                <View style={ss.audienceHeader}>
                  <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]}>Assign To</Text>
                  <View style={ss.targetToggle}>
                    <Text style={[Typography.label.sm, { color: isAll ? theme.colors.primaryLight : theme.colors.textSecondary }]}>All Students</Text>
                    <Switch 
                      value={isAll}
                      onValueChange={(val) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsAll(val); }}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                      style={{ transform: [{ scale: 0.8 }], marginLeft: 4 }}
                    />
                  </View>
                </View>

                {!isAll && (
                  <Animated.View entering={FadeInDown} layout={Layout.springify()} style={[ss.builderBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <View style={ss.builderSection}>
                      <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginBottom: 8 }]}>BRANCH</Text>
                      <SegmentedControl options={BRANCHES} selected={branch} onSelect={setBranch} />
                    </View>
                    <View style={[ss.builderDivider, { backgroundColor: theme.colors.border }]} />
                    <View style={ss.builderSection}>
                      <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginBottom: 8 }]}>SEMESTER</Text>
                      <SegmentedControl options={SEMESTERS} selected={semester} onSelect={setSemester} />
                    </View>
                    <View style={[ss.builderDivider, { backgroundColor: theme.colors.border }]} />
                    <View style={ss.builderSection}>
                      <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginBottom: 8 }]}>SECTION</Text>
                      <SegmentedControl options={SECTIONS} selected={section} onSelect={setSection} />
                    </View>
                  </Animated.View>
                )}
              </Animated.View>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Smart Footer ── */}
      {mode === 'create' && (
        <Animated.View entering={FadeInUp.duration(500).delay(400)} style={[ss.footerArea, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, paddingBottom: insets.bottom + 16 }]}>
          <View style={ss.liveCountBox}>
            <View style={[ss.liveCountIcon, { backgroundColor: `${theme.colors.info}20` }]}>
              <Users color={theme.colors.info} size={18} strokeWidth={2.5} />
            </View>
            <View>
              <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}>Estimated Class</Text>
              <Animated.Text layout={Layout.springify()} style={[Typography.headline.md, { color: theme.colors.textPrimary }]}>
                ~{estimatedCount} Students
              </Animated.Text>
            </View>
          </View>

          <SpringButton onPress={handleCreate} scaleDown={0.96} style={{ flex: 1 }}>
            <View style={[ss.submitBtn, { backgroundColor: theme.colors.primary }]}>
              <Send color="#fff" size={20} strokeWidth={2.5} />
              <Text style={[Typography.headline.sm, { color: '#fff', marginLeft: 8 }]}>Assign</Text>
            </View>
          </SpringButton>
        </Animated.View>
      )}

    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: Spacing.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.page.horizontal,
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)'
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
  },
  scroll: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: Spacing.sm,
  },
  composerCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.cardLight,
  },
  titleInput: {
    ...Typography.headline.md,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  composerDivider: {
    height: 1,
  },
  bodyInput: {
    ...Typography.body.md,
    lineHeight: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 140,
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  attachmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  dateInput: {
    ...Typography.body.sm,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: 100,
    textAlign: 'center',
  },
  audienceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  targetToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  builderBox: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingVertical: 16,
    ...Shadows.cardLight,
  },
  builderSection: {
    paddingHorizontal: 16,
  },
  builderDivider: {
    height: 1,
    marginVertical: 16,
  },
  segmentScroll: {
    gap: 8,
  },
  segmentChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  footerArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: 16,
    borderTopWidth: 1,
    ...Shadows.float,
  },
  liveCountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    flex: 1,
  },
  liveCountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: Radius.xl,
    ...Shadows.glow,
  },
  emptyCard: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  assignmentCard: {
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: Radius.full,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  priorityPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  analyticsBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: Radius.lg,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  }
});
