import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Megaphone, BookOpen, Layers, CheckCircle2, Pin } from 'lucide-react-native';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { GlassCard, SpringButton } from '@/components/ui';
import { useFacultyStore, FacultyNotice, FacultyAssignment } from '@/store/faculty.store';
import { useAuthStore } from '@/store/auth.store';

// Feed Items can be Notices or Assignments
type FeedItem = 
  | { kind: 'notice', data: FacultyNotice, timestamp: number }
  | { kind: 'assignment', data: FacultyAssignment, timestamp: number };

function getRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function UnifiedCampusFeed() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const profile = useAuthStore(s => s.profile);
  const { activeNotices, activeAssignments } = useFacultyStore();

  const feedItems = useMemo(() => {
    // Filter Notices
    const myNotices = activeNotices.filter(n => {
      if (n.status !== 'Active') return false;
      if (n.target.isAll) return true;
      const bMatch = !n.target.branch || n.target.branch === profile?.branch;
      const semMatch = !n.target.semester || n.target.semester === profile?.semester;
      const secMatch = !n.target.section || n.target.section === profile?.section;
      return bMatch && semMatch && secMatch;
    }).map(n => ({ kind: 'notice' as const, data: n, timestamp: new Date(n.date).getTime() }));

    // Filter Assignments
    const myAssignments = activeAssignments.filter(a => {
      if (a.target.isAll) return true;
      const bMatch = !a.target.branch || a.target.branch === profile?.branch;
      const semMatch = !a.target.semester || a.target.semester === profile?.semester;
      const secMatch = !a.target.section || a.target.section === profile?.section;
      return bMatch && semMatch && secMatch;
    }).map(a => ({ kind: 'assignment' as const, data: a, timestamp: new Date(a.date).getTime() }));

    const combined: FeedItem[] = [...myNotices, ...myAssignments];
    
    // Sort: Pinned notices first, then chronological
    combined.sort((a, b) => {
      const aPinned = a.kind === 'notice' && a.data.isPinned;
      const bPinned = b.kind === 'notice' && b.data.isPinned;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return b.timestamp - a.timestamp;
    });

    return combined;
  }, [activeNotices, activeAssignments, profile]);

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.duration(400)} style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={ss.headerTopRow}>
          <SpringButton onPress={() => router.back()} scaleDown={0.88}>
            <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
              <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
            </GlassCard>
          </SpringButton>
          <View style={[ss.headerBadge, { backgroundColor: `${theme.colors.primary}15` }]}>
            <Layers color={theme.colors.primary} size={14} />
            <Text style={[Typography.label.md, { color: theme.colors.primary, marginLeft: 6, fontWeight: '700' }]}>
              Campus Feed
            </Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={[ss.listContent, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false}>
        {feedItems.length === 0 ? (
          <View style={ss.emptyState}>
            <View style={[ss.emptyIcon, { backgroundColor: `${theme.colors.textTertiary}15` }]}>
              <CheckCircle2 color={theme.colors.textTertiary} size={40} />
            </View>
            <Text style={[Typography.headline.md, { color: theme.colors.textPrimary }]}>You are all caught up!</Text>
            <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 4 }]}>No recent activity in your feed.</Text>
          </View>
        ) : (
          feedItems.map((item, i) => {
            const isNotice = item.kind === 'notice';
            const isPinned = isNotice && item.data.isPinned;

            return (
              <Animated.View key={`${item.kind}-${isNotice ? item.data.id : item.data.id}`} entering={FadeInDown.duration(400).delay(i * 100)} layout={Layout.springify()}>
                <View style={[ss.feedCardWrapper, isPinned && { padding: 1, borderRadius: Radius.xl + 1, backgroundColor: `${theme.colors.warning}40` }]}>
                  <GlassCard intensity={isDark ? 30 : 70} style={[ss.feedCard, { borderColor: theme.colors.border }]}>
                    
                    {/* Header: Type and Time */}
                    <View style={ss.cardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {isPinned && (
                          <View style={[ss.pinnedTag, { backgroundColor: `${theme.colors.warning}15` }]}>
                            <Pin color={theme.colors.warning} size={12} style={{ transform: [{ rotate: '45deg' }] }} />
                          </View>
                        )}
                        <View style={[ss.typePill, { backgroundColor: isNotice ? `${theme.colors.primary}15` : `${theme.colors.info}15` }]}>
                          {isNotice ? <Megaphone color={theme.colors.primary} size={12} /> : <BookOpen color={theme.colors.info} size={12} />}
                          <Text style={[Typography.label.xs, { color: isNotice ? theme.colors.primary : theme.colors.info, marginLeft: 6, fontWeight: '700' }]}>
                            {isNotice ? item.data.type : 'New Assignment'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}>
                        {getRelativeTime(item.timestamp)}
                      </Text>
                    </View>

                    {/* Content */}
                    <Text style={[Typography.headline.md, { color: theme.colors.textPrimary, marginTop: 12, letterSpacing: -0.3 }]}>
                      {isNotice ? item.data.title : item.data.title}
                    </Text>
                    
                    {!isNotice && (
                      <Text style={[Typography.label.sm, { color: theme.colors.info, marginTop: 4 }]}>
                        {item.data.subject_name} • Due {new Date(item.data.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    )}

                    <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 8, lineHeight: 22 }]} numberOfLines={3}>
                      {isNotice ? item.data.description : item.data.description}
                    </Text>

                    {/* Action */}
                    <View style={[ss.cardFooter, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                      <SpringButton scaleDown={0.96} onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(isNotice ? '/announcements' : '/assignments');
                      }}>
                        <View style={[ss.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                          <Text style={[Typography.label.md, { color: theme.colors.textPrimary, fontWeight: '600' }]}>
                            {isNotice ? 'View Details' : 'Open Workspace'}
                          </Text>
                        </View>
                      </SpringButton>
                    </View>

                  </GlassCard>
                </View>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: Spacing.md,
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
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  listContent: {
    padding: Spacing.page.horizontal,
    paddingTop: Spacing.xl,
  },
  feedCardWrapper: {
    marginBottom: Spacing.xl,
    ...Shadows.cardLight,
  },
  feedCard: {
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  pinnedTag: {
    padding: 4,
    borderRadius: Radius.sm,
  },
  cardFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  actionBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: Radius.lg,
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
