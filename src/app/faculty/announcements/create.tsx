import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Paperclip, Users, Pin, Info } from 'lucide-react-native';

import { GlassCard, SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useFacultyStore, NoticeType } from '@/store/faculty.store';
import { createAnnouncement } from '@/services/announcement.service';
import { estimateAudience, normalizeYear } from '@/services/targeting.service';
import type { BranchCode, SectionCode } from '@/types/targeting';
import { safeBack } from '@/lib/navigation';

const NOTICE_TYPES: NoticeType[] = [
  'General Notice', 'Assignment', 'Study Material', 'Important Alert', 'Event', 'Holiday'
];

const BRANCHES: BranchCode[] = ['CSE', 'CE', 'ME', 'EE', 'ECE'];
const YEARS = ['1', '2', '3', '4'];
const SECTIONS: SectionCode[] = ['A', 'B', 'C', 'D'];

export default function FacultyCreateNotice() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile, createNotice } = useFacultyStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<NoticeType>('General Notice');
  const [isPinned, setIsPinned] = useState(false);
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  
  const [isAll, setIsAll] = useState(true);
  const [branch, setBranch] = useState<BranchCode>('CSE');
  const [year, setYear] = useState('2');
  const [section, setSection] = useState<SectionCode>('A');

  const estimatedCount = useMemo(() => {
    const target = isAll
      ? { entireCollege: true as const }
      : { branch, year: normalizeYear(year), section };
    return estimateAudience(target).estimatedCount;
  }, [isAll, branch, year, section]);

  const handleBroadcast = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Validation Error', 'Title and description are required.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const target = isAll
      ? { entireCollege: true as const }
      : {
          branch,
          year: normalizeYear(year),
          section,
          allSections: false,
        };

    try {
      await createAnnouncement({
        title: title.trim(),
        description: description.trim(),
        category: type,
        target,
        authorId: profile.employeeId,
        authorName: profile.name,
        priority,
        isPinned,
      });

      createNotice({
        title,
        description,
        type,
        isPinned,
        priority,
        target: {
          isAll,
          branch: isAll ? undefined : branch,
          year: isAll ? undefined : year,
          section: isAll ? undefined : section,
        },
      });

      Alert.alert('Success', 'Announcement broadcasted successfully!', [
        { text: 'OK', onPress: () => safeBack('/faculty') },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to broadcast announcement';
      Alert.alert('Error', message);
    }
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
          safeBack('/faculty');
        }} scaleDown={0.88}>
          <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
          </GlassCard>
        </SpringButton>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[Typography.display.small, { color: theme.colors.textPrimary, letterSpacing: -0.5 }]}>New Broadcast</Text>
        </View>
      </Animated.View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[ss.scroll, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
          
          {/* ── 1. Notice Composer (Notion Style) ── */}
          <Animated.View entering={FadeInUp.duration(500).delay(100)}>
            <GlassCard intensity={isDark ? 20 : 60} style={[ss.composerCard, { borderColor: theme.colors.border }]} padding={0}>
              <TextInput
                style={[ss.titleInput, { color: theme.colors.textPrimary }]}
                placeholder="Notice Title"
                placeholderTextColor={theme.colors.textTertiary}
                value={title}
                onChangeText={setTitle}
                maxLength={80}
              />
              <View style={[ss.composerDivider, { backgroundColor: theme.colors.border }]} />
              <TextInput
                style={[ss.bodyInput, { color: theme.colors.textPrimary }]}
                placeholder="Write your announcement..."
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
                    <Text style={[Typography.label.sm, { color: theme.colors.textSecondary, marginLeft: 6 }]}>Add Attachment</Text>
                  </View>
                </SpringButton>
                
                <View style={ss.pinToggle}>
                  <Pin color={isPinned ? theme.colors.primaryLight : theme.colors.textTertiary} size={16} style={{ marginRight: 6 }} />
                  <Text style={[Typography.label.sm, { color: isPinned ? theme.colors.textPrimary : theme.colors.textSecondary, marginRight: 8 }]}>Pin to top</Text>
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

          {/* ── 2. Category Selector ── */}
          <Animated.View entering={FadeInUp.duration(500).delay(200)} style={{ marginTop: Spacing.xl }}>
            <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginBottom: 12 }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {NOTICE_TYPES.map(t => {
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

          {/* ── 2.5 Priority Selector ── */}
          <Animated.View entering={FadeInUp.duration(500).delay(250)} style={{ marginTop: Spacing.xl }}>
            <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginBottom: 12 }]}>Priority</Text>
            <SegmentedControl 
              options={['normal', 'high', 'urgent']} 
              selected={priority} 
              onSelect={(val) => setPriority(val as any)} 
            />
          </Animated.View>

          {/* ── 3. Smart Audience Builder ── */}
          <Animated.View entering={FadeInUp.duration(500).delay(300)} style={{ marginTop: Spacing.xl }}>
            <View style={ss.audienceHeader}>
              <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]}>Audience Targeting</Text>
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

                <View style={[ss.builderDivider, { backgroundColor: theme.colors.border }]} />

                <View style={ss.builderSection}>
                  <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginBottom: 8 }]}>YEAR</Text>
                  <SegmentedControl options={YEARS} selected={year} onSelect={setYear} />
                </View>

                <View style={[ss.builderDivider, { backgroundColor: theme.colors.border }]} />

                <View style={ss.builderSection}>
                  <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginBottom: 8 }]}>SECTION</Text>
                  <SegmentedControl options={SECTIONS} selected={section} onSelect={(value) => setSection(value as SectionCode)} />
                </View>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── 4. Smart Footer with Live Count ── */}
      <Animated.View entering={FadeInUp.duration(500).delay(400)} style={[ss.footerArea, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, paddingBottom: insets.bottom + 16 }]}>
        <View style={ss.liveCountBox}>
          <View style={[ss.liveCountIcon, { backgroundColor: `${theme.colors.info}20` }]}>
            <Users color={theme.colors.info} size={18} strokeWidth={2.5} />
          </View>
          <View>
            <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}>Estimated Reach</Text>
            <Animated.Text layout={Layout.springify()} style={[Typography.headline.md, { color: theme.colors.textPrimary }]}>
              ~{estimatedCount} Students
            </Animated.Text>
          </View>
        </View>

        <SpringButton onPress={handleBroadcast} scaleDown={0.96} style={{ flex: 1 }}>
          <View style={[ss.submitBtn, { backgroundColor: theme.colors.primary }]}>
            <Send color="#fff" size={20} strokeWidth={2.5} />
            <Text style={[Typography.headline.sm, { color: '#fff', marginLeft: 8 }]}>Broadcast</Text>
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
    paddingTop: 20,
    paddingBottom: 16,
  },
  composerDivider: {
    height: 1,
  },
  bodyInput: {
    ...Typography.body.md,
    lineHeight: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 180,
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
});
