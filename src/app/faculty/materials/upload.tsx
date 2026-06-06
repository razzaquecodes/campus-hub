import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Paperclip, Pin } from 'lucide-react-native';

import { GlassCard, SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useResourceStore, ResourceType } from '@/store/resources.store';
import { useFacultyStore } from '@/store/faculty.store';
import type { BranchCode, SectionCode } from '@/types/targeting';

const RESOURCE_TYPES: ResourceType[] = ['Notes', 'PPT', 'PYQ', 'Lab Manual', 'Assignment', 'Other'];
const BRANCHES: BranchCode[] = ['CSE', 'CE', 'ME', 'EE', 'ECE'];
const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const SECTIONS: SectionCode[] = ['A', 'B', 'C', 'D'];

export default function FacultyUploadResource() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { uploadResource } = useResourceStore();
  const { profile } = useFacultyStore();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<ResourceType>('Notes');
  const [isPinned, setIsPinned] = useState(false);
  
  const [isAll, setIsAll] = useState(true);
  const [branch, setBranch] = useState<BranchCode>('CSE');
  const [semester, setSemester] = useState('6');
  const [section, setSection] = useState<SectionCode>('A');

  const [hasAttachment, setHasAttachment] = useState(false);

  const handleUpload = () => {
    if (!title.trim() || !subject.trim()) {
      Alert.alert('Validation Error', 'Title and Subject are required.');
      return;
    }
    if (!hasAttachment) {
      Alert.alert('Validation Error', 'Please attach a file before uploading.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    uploadResource({
      title,
      subject,
      type,
      isPinned,
      size: '1.5 MB', // Mock file size
      authorName: profile.name,
      target: {
        isAll,
        branch: isAll ? undefined : branch,
        semester: isAll ? undefined : semester,
        section: isAll ? undefined : section,
      }
    });

    Alert.alert('Success', 'Resource uploaded successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const handleAttachMock = () => {
    Haptics.selectionAsync();
    setHasAttachment(true);
  };

  const SegmentedControl = ({ options, selected, onSelect }: { options: string[], selected: string, onSelect: (s: string) => void }) => (
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
            <Text style={[Typography.label.md, { color: active ? '#fff' : theme.colors.textSecondary, fontWeight: active ? '700' : '500' }]}>{opt}</Text>
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
          router.back();
        }} scaleDown={0.88}>
          <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
          </GlassCard>
        </SpringButton>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[Typography.display.small, { color: theme.colors.textPrimary, letterSpacing: -0.5 }]}>Upload Resource</Text>
        </View>
      </Animated.View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[ss.scroll, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
          
          {/* ── 1. Form Details ── */}
          <Animated.View entering={FadeInUp.duration(500).delay(100)}>
            <GlassCard intensity={isDark ? 20 : 60} style={[ss.formCard, { borderColor: theme.colors.border }]} padding={0}>
              <TextInput
                style={[ss.titleInput, { color: theme.colors.textPrimary }]}
                placeholder="Resource Title (e.g. Module 1 Notes)"
                placeholderTextColor={theme.colors.textTertiary}
                value={title}
                onChangeText={setTitle}
                maxLength={80}
              />
              <View style={[ss.divider, { backgroundColor: theme.colors.border }]} />
              <TextInput
                style={[ss.subjectInput, { color: theme.colors.textPrimary }]}
                placeholder="Subject Name"
                placeholderTextColor={theme.colors.textTertiary}
                value={subject}
                onChangeText={setSubject}
              />
              
              <View style={[ss.formFooter, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }]}>
                <SpringButton scaleDown={0.96} onPress={handleAttachMock}>
                  <View style={[ss.attachmentBtn, { 
                    backgroundColor: hasAttachment ? `${theme.colors.success}20` : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'),
                    borderColor: hasAttachment ? theme.colors.success : 'transparent',
                    borderWidth: 1
                  }]}>
                    <Paperclip color={hasAttachment ? theme.colors.success : theme.colors.textSecondary} size={16} />
                    <Text style={[Typography.label.sm, { color: hasAttachment ? theme.colors.success : theme.colors.textSecondary, marginLeft: 6 }]}>
                      {hasAttachment ? 'File Attached (1.5 MB)' : 'Attach File'}
                    </Text>
                  </View>
                </SpringButton>
                
                <View style={ss.pinToggle}>
                  <Pin color={isPinned ? theme.colors.primaryLight : theme.colors.textTertiary} size={16} style={{ marginRight: 6 }} />
                  <Text style={[Typography.label.sm, { color: isPinned ? theme.colors.textPrimary : theme.colors.textSecondary, marginRight: 8 }]}>Pin</Text>
                  <Switch 
                    value={isPinned}
                    onValueChange={(val) => { Haptics.selectionAsync(); setIsPinned(val); }}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    style={{ transform: [{ scale: 0.8 }] }}
                  />
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* ── 2. Resource Type Selector ── */}
          <Animated.View entering={FadeInUp.duration(500).delay(200)} style={{ marginTop: Spacing.xl }}>
            <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginBottom: 12 }]}>Resource Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {RESOURCE_TYPES.map(t => {
                const active = type === t;
                return (
                  <TouchableOpacity 
                    key={t}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setType(t);
                    }}
                    style={[
                      ss.typeChip, 
                      { 
                        backgroundColor: active ? `${theme.colors.primary}15` : 'transparent',
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                        borderWidth: 1.5 
                      }
                    ]}
                  >
                    <Text style={[Typography.label.md, { color: active ? theme.colors.primaryLight : theme.colors.textSecondary, fontWeight: active ? '700' : '500' }]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* ── 3. Smart Audience Builder ── */}
          <Animated.View entering={FadeInUp.duration(500).delay(300)} style={{ marginTop: Spacing.xl }}>
            <View style={ss.audienceHeader}>
              <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]}>Visibility Targeting</Text>
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
                  <SegmentedControl options={BRANCHES} selected={branch} onSelect={(value) => setBranch(value as BranchCode)} />
                </View>

                <View style={[ss.divider, { backgroundColor: theme.colors.border, marginVertical: 16 }]} />

                <View style={ss.builderSection}>
                  <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginBottom: 8 }]}>SEMESTER</Text>
                  <SegmentedControl options={SEMESTERS} selected={semester} onSelect={setSemester} />
                </View>

                <View style={[ss.divider, { backgroundColor: theme.colors.border, marginVertical: 16 }]} />

                <View style={ss.builderSection}>
                  <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginBottom: 8 }]}>SECTION</Text>
                  <SegmentedControl options={SECTIONS} selected={section} onSelect={(value) => setSection(value as SectionCode)} />
                </View>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── 4. Footer ── */}
      <Animated.View entering={FadeInUp.duration(500).delay(400)} style={[ss.footerArea, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, paddingBottom: insets.bottom + 16 }]}>
        <SpringButton onPress={handleUpload} scaleDown={0.96} style={{ flex: 1 }}>
          <View style={[ss.submitBtn, { backgroundColor: theme.colors.primary }]}>
            <Send color="#fff" size={20} strokeWidth={2.5} />
            <Text style={[Typography.headline.sm, { color: '#fff', marginLeft: 8 }]}>Upload Resource</Text>
          </View>
        </SpringButton>
      </Animated.View>
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
  scroll: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: Spacing.sm,
  },
  formCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.cardLight,
  },
  titleInput: {
    ...Typography.headline.md,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  subjectInput: {
    ...Typography.body.md,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  divider: { height: 1 },
  formFooter: {
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
  pinToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
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
  segmentScroll: { gap: 8 },
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
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: Radius.xl,
    ...Shadows.glow,
  },
});
