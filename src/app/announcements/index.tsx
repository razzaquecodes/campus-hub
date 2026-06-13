import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Megaphone, Pin, FileText, CheckCircle2 } from 'lucide-react-native';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { GlassCard, SpringButton } from '@/components/ui';
import { useMasterProfile } from '@/hooks/use-master-profile';
import { useCampusAnnouncementFeed } from '@/hooks/queries/use-announcement-system';
import { useRealtimeAnnouncements } from '@/hooks/use-realtime';
import type { CampusAnnouncement } from '@/types/announcement';
import { safeBack } from '@/lib/navigation';

const FILTERS: { id: string, label: string }[] = [
  { id: 'all', label: 'All Updates' },
  { id: 'General Notice', label: 'General' },
  { id: 'Assignment', label: 'Assignments' },
  { id: 'Study Material', label: 'Materials' },
  { id: 'Important Alert', label: 'Alerts' },
];

function getRelativeTime(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function StudentAnnouncementCenter() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useMasterProfile();
  const { data: announcements = [], refetch } = useCampusAnnouncementFeed(profile);
  const [activeFilter, setActiveFilter] = useState('all');
  const [readIds, setReadIds] = useState<string[]>([]);

  useRealtimeAnnouncements(() => { void refetch(); });

  const myNotices = useMemo(() => {
    let filtered = announcements.filter((n) => {
      if (activeFilter !== 'all' && n.category !== activeFilter) return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return filtered;
  }, [announcements, activeFilter]);

  const handlePressNotice = (notice: CampusAnnouncement) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReadIds((prev) => (prev.includes(notice.id) ? prev : [...prev, notice.id]));
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
          <View style={[ss.unreadBadge, { backgroundColor: `${theme.colors.primary}15` }]}>
            <Megaphone color={theme.colors.primary} size={14} />
            <Text style={[Typography.label.md, { color: theme.colors.primary, marginLeft: 6, fontWeight: '700' }]}>
              {myNotices.length} Updates
            </Text>
          </View>
        </View>
        
        <Text style={[Typography.display.small, { color: theme.colors.textPrimary, marginTop: Spacing.xl, letterSpacing: -0.5 }]}>
          Announcement Center
        </Text>
        <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 4 }]}>
          Important updates and materials from your faculty.
        </Text>

        {/* ── Filters ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ss.filterScroll}>
          {FILTERS.map(f => {
            const active = activeFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveFilter(f.id);
                }}
                style={[
                  ss.filterChip,
                  { 
                    backgroundColor: active ? theme.colors.primary : 'transparent',
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  }
                ]}
              >
                <Text style={[Typography.label.md, { color: active ? '#fff' : theme.colors.textSecondary, fontWeight: active ? '700' : '500' }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* ── Timeline ── */}
      <ScrollView 
        contentContainerStyle={[ss.listContent, { paddingBottom: insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {myNotices.length === 0 ? (
          <Animated.View entering={FadeIn.duration(400)} style={ss.emptyState}>
            <View style={[ss.emptyIcon, { backgroundColor: `${theme.colors.textTertiary}15` }]}>
              <CheckCircle2 color={theme.colors.textTertiary} size={40} />
            </View>
            <Text style={[Typography.headline.md, { color: theme.colors.textPrimary }]}>All Caught Up!</Text>
            <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 4 }]}>No new announcements in this category.</Text>
          </Animated.View>
        ) : (
          myNotices.map((notice, i) => {
            const isRead = readIds.includes(notice.id);
            return (
            <Animated.View key={notice.id} entering={FadeInDown.duration(400).delay(i * 100)} layout={Layout.springify()}>
              <View style={ss.timelineRow}>
                {/* Timeline Axis */}
                <View style={ss.timelineAxis}>
                  <View style={[ss.timelineDot, { backgroundColor: notice.isPinned ? theme.colors.warning : theme.colors.primaryLight }]} />
                  {i !== myNotices.length - 1 && (
                    <View style={[ss.timelineLine, { backgroundColor: theme.colors.border }]} />
                  )}
                </View>

                {/* Timeline Card */}
                <View style={{ flex: 1, paddingBottom: Spacing.xl }}>
                  <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }]}>
                    {getRelativeTime(notice.createdAt)}
                  </Text>
                  
                  <SpringButton scaleDown={0.98} onPress={() => handlePressNotice(notice)}>
                    <View style={[ss.cardWrapper, notice.isPinned && { padding: 1, borderRadius: Radius.xl + 1, backgroundColor: `${theme.colors.warning}40` }]}>
                      <View style={[ss.noticeCard, { backgroundColor: theme.colors.surface, borderColor: isRead ? theme.colors.border : theme.colors.primary }]}>
                        
                        <View style={ss.cardHeader}>
                          {!isRead && (
                            <View style={[ss.unreadDot, { backgroundColor: theme.colors.primary }]} />
                          )}
                          {notice.isPinned && (
                            <View style={[ss.pinnedTag, { backgroundColor: `${theme.colors.warning}15` }]}>
                              <Pin color={theme.colors.warning} size={12} style={{ transform: [{ rotate: '45deg' }] }} />
                              <Text style={[Typography.label.xs, { color: theme.colors.warning, marginLeft: 4, fontWeight: '700' }]}>PINNED</Text>
                            </View>
                          )}
                          {notice.priority && notice.priority !== 'normal' && (
                            <View style={[ss.priorityTag, { backgroundColor: notice.priority === 'urgent' ? `${theme.colors.danger}15` : `${theme.colors.warning}15` }]}>
                              <Text style={[Typography.label.xs, { color: notice.priority === 'urgent' ? theme.colors.danger : theme.colors.warning, fontWeight: '700' }]}>
                                {notice.priority.toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <View style={[ss.typeTag, { backgroundColor: `${theme.colors.primary}12` }]}>
                            <Text style={[Typography.label.sm, { color: theme.colors.primaryLight, fontWeight: '600' }]}>{notice.category}</Text>
                          </View>
                        </View>

                        <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginTop: 12, letterSpacing: -0.2 }]}>
                          {notice.title}
                        </Text>
                        <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 8, lineHeight: 22 }]}>
                          {notice.description}
                        </Text>

                        {notice.category === 'Study Material' && (
                          <View style={[ss.attachmentBox, { borderColor: theme.colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                            <FileText color={theme.colors.textSecondary} size={16} />
                            <Text style={[Typography.label.sm, { color: theme.colors.textSecondary, marginLeft: 8 }]}>Material_Document.pdf</Text>
                          </View>
                        )}
                        
                      </View>
                    </View>
                  </SpringButton>
                </View>
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
  unreadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  filterScroll: {
    marginTop: Spacing.xl,
    flexGrow: 0,
    marginBottom: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: 8,
  },
  listContent: {
    padding: Spacing.page.horizontal,
    paddingTop: Spacing.xl,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineAxis: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    ...Shadows.glow,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 8,
    borderRadius: 1,
  },
  cardWrapper: {
    ...Shadows.cardLight,
  },
  noticeCard: {
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  pinnedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
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
