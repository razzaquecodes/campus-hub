import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ArrowLeft, BookOpen, CheckCircle2, Layers, Megaphone, Pin } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Linking, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard, SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useCampusAnnouncementFeed } from '@/hooks/queries/use-announcement-system';
import { useNotifications } from '@/hooks/queries/use-notifications';
import { useMasterProfile } from '@/hooks/use-master-profile';
import { useRealtimeAnnouncements } from '@/hooks/use-realtime';
import type { CampusAnnouncement } from '@/types/announcement';
import { safeBack } from '@/lib/navigation';

type FeedItem =
  | {
      kind: 'announcement';
      id: string;
      title: string;
      description: string;
      category: string;
      timestamp: number;
      isPinned: boolean;
      route: string;
    }
  | {
      kind: 'notification';
      id: string;
      title: string;
      description: string;
      category: string;
      timestamp: number;
      actionUrl?: string | null;
    };

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
  const masterProfile = useMasterProfile();
  const { data: campusAnnouncements = [], refetch: refetchAnnouncements } = useCampusAnnouncementFeed(masterProfile);
  const {
    data: notifications = [],
    refetch: refetchNotifications,
  } = useNotifications();

  useRealtimeAnnouncements(() => {
    void refetchAnnouncements();
  });

  const feedItems = useMemo<FeedItem[]>(() => {
    const announcementItems: FeedItem[] = campusAnnouncements.map((announcement: CampusAnnouncement) => ({
      kind: 'announcement',
      id: announcement.id,
      title: announcement.title,
      description: announcement.description,
      category: announcement.category,
      timestamp: new Date(announcement.createdAt).getTime(),
      isPinned: announcement.isPinned,
      route: '/announcements',
    }));

    const notificationItems: FeedItem[] = notifications.map((notification) => ({
      kind: 'notification',
      id: notification.id,
      title: notification.title,
      description: notification.body,
      category: notification.category,
      timestamp: new Date(notification.created_at).getTime(),
      actionUrl: notification.action_url,
    }));

    const combined = [...notificationItems, ...announcementItems];
    combined.sort((a, b) => {
      const aPinned = a.kind === 'announcement' && a.isPinned;
      const bPinned = b.kind === 'announcement' && b.isPinned;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return b.timestamp - a.timestamp;
    });

    return combined;
  }, [campusAnnouncements, notifications]);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchAnnouncements(), refetchNotifications()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchAnnouncements, refetchNotifications]);

  const handlePressItem = useCallback(async (item: FeedItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item.kind === 'notification' && item.actionUrl) {
      if (item.actionUrl.startsWith('http')) {
        await Linking.openURL(item.actionUrl);
        return;
      }
      router.push(item.actionUrl as any);
      return;
    }
    router.push(item.kind === 'announcement' ? (item.route as any) : '/notifications');
  }, []);

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.duration(400)} style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={ss.headerTopRow}>
          <SpringButton onPress={() => safeBack('/(tabs)')} scaleDown={0.88}>
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

      <ScrollView contentContainerStyle={[ss.listContent, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}>
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
            const isAnnouncement = item.kind === 'announcement';
            const isPinned = isAnnouncement && item.isPinned;

            return (
              <Animated.View key={`${item.kind}-${item.id}`} entering={FadeInDown.duration(400).delay(i * 100)} layout={Layout.springify()}>
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
                        <View style={[ss.typePill, { backgroundColor: isAnnouncement ? `${theme.colors.primary}15` : `${theme.colors.info}15` }]}>
                          {isAnnouncement ? <Megaphone color={theme.colors.primary} size={12} /> : <BookOpen color={theme.colors.info} size={12} />}
                          <Text style={[Typography.label.xs, { color: isAnnouncement ? theme.colors.primary : theme.colors.info, marginLeft: 6, fontWeight: '700' }]}>
                            {isAnnouncement ? item.category : 'Notification'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}> 
                        {getRelativeTime(item.timestamp)}
                      </Text>
                    </View>
 
                    {/* Content */}
                    <Text style={[Typography.headline.md, { color: theme.colors.textPrimary, marginTop: 12, letterSpacing: -0.3 }]}>
                      {item.title}
                    </Text>
 
                    <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 8, lineHeight: 22 }]} numberOfLines={3}>
                      {item.description}
                    </Text>
 
                    {/* Action */}
                    <View style={[ss.cardFooter, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}> 
                      <SpringButton scaleDown={0.96} onPress={() => handlePressItem(item)}>
                        <View style={[ss.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                          <Text style={[Typography.label.md, { color: theme.colors.textPrimary, fontWeight: '600' }]}> 
                            {isAnnouncement ? 'View Announcement' : 'Open Notification'}
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
