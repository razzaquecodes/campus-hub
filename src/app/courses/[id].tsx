import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, BookOpen, Bell, Folder, MessageSquare, Megaphone, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { GlassCard, SpringButton } from '@/components/ui';

export default function SubjectWorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Mock Data
  const subject = {
    id: id || 'dbms',
    name: 'Database Management Systems',
    code: 'CS-402',
    faculty: 'Dr. S. K. Singh',
    progress: 65, // %
  };

  const QUICK_LINKS = [
    { id: 'announcements', label: 'Announcements', icon: Megaphone, color: theme.colors.primary, route: '/announcements' },
    { id: 'assignments', label: 'Assignments', icon: BookOpen, color: theme.colors.warning, route: '/assignments' },
    { id: 'resources', label: 'Resources', icon: Folder, color: theme.colors.success, route: '/materials' },
    { id: 'doubts', label: 'Doubt Desk', icon: MessageSquare, color: theme.colors.info, route: '/doubts' },
  ];

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      
      <Animated.View entering={FadeInDown.duration(400)} style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}>
        <SpringButton onPress={() => router.back()} scaleDown={0.88}>
          <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
          </GlassCard>
        </SpringButton>
      </Animated.View>

      <ScrollView contentContainerStyle={[ss.content, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false}>
        
        {/* ── Premium Hero ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <View style={[ss.heroCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, overflow: 'hidden' }]}>
            <LinearGradient 
              colors={isDark ? ['rgba(99,102,241,0.15)', 'transparent'] : ['rgba(79,70,229,0.1)', 'transparent']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <View style={{ zIndex: 2 }}>
              <View style={[ss.codePill, { backgroundColor: `${theme.colors.primary}15` }]}>
                <Text style={[Typography.label.sm, { color: theme.colors.primaryLight, fontWeight: '700' }]}>{subject.code}</Text>
              </View>
              <Text style={[Typography.display.small, { color: theme.colors.textPrimary, marginTop: 16, letterSpacing: -0.5, lineHeight: 36 }]}>
                {subject.name}
              </Text>
              <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                Prof. {subject.faculty}
              </Text>

              <View style={[ss.analyticsBox, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', borderColor: theme.colors.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={[Typography.label.sm, { color: theme.colors.textSecondary }]}>Syllabus Progress</Text>
                  <Text style={[Typography.label.sm, { color: theme.colors.textPrimary, fontWeight: '700' }]}>{subject.progress}%</Text>
                </View>
                <View style={[ss.progressBarBg, { backgroundColor: theme.colors.border }]}>
                  <View style={[ss.progressBarFill, { width: `${subject.progress}%`, backgroundColor: theme.colors.success }]} />
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── Modules Grid ── */}
        <Animated.View entering={FadeInUp.duration(400).delay(200)} style={{ marginTop: Spacing.xl }}>
          <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginBottom: 12 }]}>Workspace Modules</Text>
          <View style={ss.grid}>
            {QUICK_LINKS.map((link, i) => {
              const Icon = link.icon;
              return (
                <View key={link.id} style={{ width: '48%', marginBottom: 16 }}>
                  <SpringButton onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(link.route as any); }} scaleDown={0.93} style={{ flex: 1 }}>
                    <GlassCard intensity={isDark ? 30 : 60} style={[ss.moduleTile, { borderColor: theme.colors.border }]}>
                      <View style={[ss.moduleIconWrap, { backgroundColor: `${link.color}15` }]}>
                        <Icon color={link.color} size={24} />
                      </View>
                      <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginTop: 12 }]}>{link.label}</Text>
                    </GlassCard>
                  </SpringButton>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Recent Activity ── */}
        <Animated.View entering={FadeInUp.duration(400).delay(300)} style={{ marginTop: Spacing.xl }}>
          <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginBottom: 12 }]}>Recent Activity</Text>
          <GlassCard intensity={isDark ? 20 : 50} style={[ss.activityCard, { borderColor: theme.colors.border }]}>
            <View style={ss.activityRow}>
              <View style={[ss.activityDot, { backgroundColor: theme.colors.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={[Typography.body.md, { color: theme.colors.textPrimary }]}>New notes added: <Text style={{ fontWeight: '600' }}>Module 3 Slides</Text></Text>
                <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginTop: 2 }]}>2 hours ago</Text>
              </View>
            </View>
            <View style={[ss.divider, { backgroundColor: theme.colors.border }]} />
            <View style={ss.activityRow}>
              <View style={[ss.activityDot, { backgroundColor: theme.colors.warning }]} />
              <View style={{ flex: 1 }}>
                <Text style={[Typography.body.md, { color: theme.colors.textPrimary }]}>Assignment Due: <Text style={{ fontWeight: '600' }}>ER Diagrams</Text></Text>
                <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginTop: 2 }]}>Tomorrow</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: Spacing.page.horizontal, paddingBottom: Spacing.md },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.page.horizontal, paddingTop: Spacing.md },
  heroCard: { padding: Spacing.xl, borderRadius: Radius.xl, borderWidth: 1 },
  codePill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.sm },
  analyticsBox: { marginTop: 20, padding: 16, borderRadius: Radius.lg, borderWidth: 1 },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  moduleTile: { padding: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1 },
  moduleIconWrap: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  activityCard: { padding: Spacing.xl, borderRadius: Radius.xl, borderWidth: 1 },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start' },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: 12 },
  divider: { height: 1, marginVertical: 16 }
});
