import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { AlertCircle, ArrowLeft, BookOpen, CheckCircle2, Clock, FileText } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard, SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAssignments } from '@/hooks/use-assignments';
import { safeBack } from '@/lib/navigation';

export default function StudentAssignmentCenter() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const { pending, completed } = useAssignments();
  const [tab, setTab] = useState<'pending' | 'completed'>('pending');

  const getDaysLeft = (dueDate: string) => {
    const diffMs = new Date(dueDate).getTime() - Date.now();
    const days = Math.ceil(diffMs / 86400000);
    return days;
  };

  const getUrgencyColor = (days: number) => {
    if (days < 0) return theme.colors.danger; // overdue
    if (days <= 2) return theme.colors.warning; // urgent
    return theme.colors.success; // fine
  };

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      {/* ── Premium Header ── */}
      <Animated.View entering={FadeInDown.duration(400)} style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={ss.headerTopRow}>
          <SpringButton onPress={() => safeBack('/(tabs)')} scaleDown={0.88}>
            <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
              <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
            </GlassCard>
          </SpringButton>
          <View style={[ss.statsBadge, { backgroundColor: `${theme.colors.warning}15` }]}>
            <Clock color={theme.colors.warning} size={14} />
            <Text style={[Typography.label.md, { color: theme.colors.warning, marginLeft: 6, fontWeight: '700' }]}>
              {pending.length} Due Soon
            </Text>
          </View>
        </View>
        
        <Text style={[Typography.display.small, { color: theme.colors.textPrimary, marginTop: Spacing.xl, letterSpacing: -0.5 }]}>
          Assignments
        </Text>
        
        {/* ── Tabs ── */}
        <View style={ss.tabContainer}>
          <View style={[ss.tabBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <TouchableOpacity 
              onPress={() => { Haptics.selectionAsync(); setTab('pending'); }} 
              style={[ss.tabBtn, tab === 'pending' && { backgroundColor: theme.colors.surface, ...Shadows.glow }]}
            >
              <Text style={[Typography.label.md, { color: tab === 'pending' ? theme.colors.textPrimary : theme.colors.textSecondary, fontWeight: '600' }]}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => { Haptics.selectionAsync(); setTab('completed'); }} 
              style={[ss.tabBtn, tab === 'completed' && { backgroundColor: theme.colors.surface, ...Shadows.glow }]}
            >
              <Text style={[Typography.label.md, { color: tab === 'completed' ? theme.colors.textPrimary : theme.colors.textSecondary, fontWeight: '600' }]}>Completed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={[ss.listContent, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false}>
        {tab === 'pending' ? (
          pending.length === 0 ? (
            <Animated.View entering={FadeIn.duration(400)} style={ss.emptyState}>
              <View style={[ss.emptyIcon, { backgroundColor: `${theme.colors.success}15` }]}>
                <CheckCircle2 color={theme.colors.success} size={40} />
              </View>
              <Text style={[Typography.headline.md, { color: theme.colors.textPrimary }]}>No Pending Work!</Text>
              <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 4 }]}>You have completed all your assignments.</Text>
            </Animated.View>
          ) : (
            pending.map((a, i) => {
              const daysLeft = getDaysLeft(a.due_date);
              const isOverdue = daysLeft < 0;
              const color = getUrgencyColor(daysLeft);

              return (
                <Animated.View key={a.id} entering={FadeInDown.duration(400).delay(i * 100)} layout={Layout.springify()}>
                  <SpringButton scaleDown={0.97} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/assignments/${a.id}`); }}>
                    <GlassCard intensity={isDark ? 30 : 70} style={[ss.card, { borderColor: isOverdue ? `${theme.colors.danger}40` : theme.colors.border }]}>
                      
                      <View style={ss.cardHeader}>
                        <View style={[ss.subjectPill, { backgroundColor: `${theme.colors.primary}15` }]}>
                          <Text style={[Typography.label.sm, { color: theme.colors.primaryLight, fontWeight: '700' }]}>{a.subject_name}</Text>
                        </View>
                        <View style={[ss.daysLeftBadge, { backgroundColor: `${color}15` }]}>
                          {isOverdue ? <AlertCircle color={color} size={14} /> : <Clock color={color} size={14} />}
                          <Text style={[Typography.label.sm, { color: color, marginLeft: 6, fontWeight: '700' }]}>
                            {isOverdue ? 'Overdue' : `${daysLeft} Days Left`}
                          </Text>
                        </View>
                      </View>

                      <Text style={[Typography.headline.md, { color: theme.colors.textPrimary, marginTop: 12, letterSpacing: -0.3 }]}>
                        {a.title}
                      </Text>
                      <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 8, lineHeight: 22 }]} numberOfLines={2}>
                        {a.description}
                      </Text>

                      {/* Mock Attachment */}
                      <View style={[ss.attachmentBox, { borderColor: theme.colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                        <FileText color={theme.colors.textSecondary} size={16} />
                        <Text style={[Typography.label.sm, { color: theme.colors.textSecondary, marginLeft: 8, flex: 1 }]}>Assignment_Instructions.pdf</Text>
                      </View>

                    </GlassCard>
                  </SpringButton>
                </Animated.View>
              );
            })
          )
        ) : (
          completed.length === 0 ? (
            <Animated.View entering={FadeIn.duration(400)} style={ss.emptyState}>
              <View style={[ss.emptyIcon, { backgroundColor: `${theme.colors.textTertiary}15` }]}>
                <BookOpen color={theme.colors.textTertiary} size={40} />
              </View>
              <Text style={[Typography.headline.md, { color: theme.colors.textPrimary }]}>No Completed Work</Text>
              <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 4 }]}>Your completed assignments will appear here.</Text>
            </Animated.View>
          ) : (
            completed.map((a, i) => (
              <Animated.View key={a.id} entering={FadeInDown.duration(400).delay(i * 100)} layout={Layout.springify()}>
                <SpringButton scaleDown={0.97} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/assignments/${a.id}`); }}>
                  <GlassCard intensity={isDark ? 20 : 60} style={[ss.card, { borderColor: theme.colors.border, opacity: 0.8 }]}>
                  <View style={ss.cardHeader}>
                    <View style={[ss.subjectPill, { backgroundColor: `${theme.colors.textTertiary}15` }]}>
                      <Text style={[Typography.label.sm, { color: theme.colors.textSecondary, fontWeight: '700' }]}>{a.subject_name}</Text>
                    </View>
                    <View style={[ss.daysLeftBadge, { backgroundColor: `${theme.colors.success}15` }]}>
                      <CheckCircle2 color={theme.colors.success} size={14} />
                      <Text style={[Typography.label.sm, { color: theme.colors.success, marginLeft: 6, fontWeight: '700' }]}>Submitted</Text>
                    </View>
                  </View>
                  <Text style={[Typography.headline.md, { color: theme.colors.textPrimary, marginTop: 12, letterSpacing: -0.3, textDecorationLine: 'line-through' }]}>
                    {a.title}
                  </Text>
                </GlassCard>
                </SpringButton>
              </Animated.View>
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.page.horizontal,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  tabContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  tabBg: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.lg,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  listContent: {
    padding: Spacing.page.horizontal,
    paddingTop: Spacing.xl,
  },
  card: {
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  daysLeftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  attachmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
});
