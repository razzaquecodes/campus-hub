// screens/notifications-screen.tsx
// CampusHub BBIT — Production Notification Center
// Real data from notifications table. Read/unread state. Categories. Mark all read.

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  AlertTriangle,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Calendar,
  Check,
  CheckCheck,
  ChevronLeft,
  Clock,
  GraduationCap,
  Info,
  Megaphone,
} from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/queries/use-notifications';
import type { Notification } from '@/api/notifications.api';

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<
  Notification['category'],
  { icon: React.FC<any>; color: string; label: string }
> = {
  general:      { icon: Info,             color: '#6366F1', label: 'General' },
  announcement: { icon: Megaphone,        color: '#8B5CF6', label: 'Announcement' },
  event:        { icon: Calendar,         color: '#3B82F6', label: 'Event' },
  attendance:   { icon: AlertTriangle,    color: '#F59E0B', label: 'Attendance' },
  assignment:   { icon: BookOpen,         color: '#10B981', label: 'Assignment' },
  placement:    { icon: BriefcaseBusiness,color: '#EC4899', label: 'Placement' },
  result:       { icon: GraduationCap,    color: '#F97316', label: 'Result' },
};

function getRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function NotifSkeleton() {
  const { theme } = useTheme();
  return (
    <View style={[ns.skeletonCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={[ns.skeletonIcon, { backgroundColor: theme.colors.border }]} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={[ns.skeletonLine, { width: '70%', backgroundColor: theme.colors.border }]} />
        <View style={[ns.skeletonLine, { width: '100%', backgroundColor: theme.colors.border }]} />
        <View style={[ns.skeletonLine, { width: '40%', backgroundColor: theme.colors.border }]} />
      </View>
    </View>
  );
}

// ─── Single notification card ─────────────────────────────────────────────────
function NotifCard({
  notif,
  index,
  onRead,
}: {
  notif: Notification;
  index: number;
  onRead: (id: string) => void;
}) {
  const { theme, isDark } = useTheme();
  const cfg = CATEGORY_CONFIG[notif.category] ?? CATEGORY_CONFIG.general;
  const Icon = cfg.icon;

  return (
    <Animated.View entering={FadeInDown.duration(350).delay(index * 50)}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          if (!notif.is_read) onRead(notif.id);
        }}
        style={({ pressed }) => [
          ns.card,
          {
            backgroundColor: notif.is_read
              ? theme.colors.surface
              : (isDark ? 'rgba(99,102,241,0.06)' : 'rgba(79,70,229,0.04)'),
            borderColor: notif.is_read
              ? theme.colors.border
              : (isDark ? 'rgba(99,102,241,0.20)' : 'rgba(79,70,229,0.15)'),
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        {/* Unread accent bar */}
        {!notif.is_read && (
          <View style={[ns.unreadBar, { backgroundColor: cfg.color }]} />
        )}

        {/* Icon */}
        <View style={[ns.iconWrap, { backgroundColor: `${cfg.color}15` }]}>
          <Icon color={cfg.color} size={18} strokeWidth={2} />
        </View>

        {/* Content */}
        <View style={ns.cardContent}>
          <View style={ns.cardTopRow}>
            <View style={[ns.categoryPill, { backgroundColor: `${cfg.color}12`, borderColor: `${cfg.color}24` }]}>
              <Text style={[ns.categoryText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            {!notif.is_read && (
              <View style={[ns.unreadDot, { backgroundColor: cfg.color }]} />
            )}
          </View>
          <Text style={[ns.cardTitle, { color: theme.colors.textPrimary }]} numberOfLines={2}>
            {notif.title}
          </Text>
          <Text style={[ns.cardBody, { color: theme.colors.textSecondary }]} numberOfLines={3}>
            {notif.body}
          </Text>
          <View style={ns.cardFooter}>
            <Clock color={theme.colors.textTertiary} size={11} strokeWidth={2} />
            <Text style={[ns.cardTime, { color: theme.colors.textTertiary }]}>
              {getRelativeTime(notif.created_at)}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function NotificationsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: notifications = [], isLoading, refetch, isFetching } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: markingAll } = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    markAllRead();
  }, [markAllRead]);

  const grouped = notifications.reduce<Record<string, Notification[]>>((acc, n) => {
    const date = new Date(n.created_at).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(n);
    return acc;
  }, {});

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.void }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.void} />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(350)}
        style={[ns.header, { paddingTop: insets.top + 10 }]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[ns.backBtn, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}
        >
          <ChevronLeft color={theme.colors.textPrimary} size={22} strokeWidth={2} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={[Typography.headline.xl, { color: theme.colors.textPrimary }]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Text style={[Typography.body.sm, { color: theme.colors.textTertiary, marginTop: 1 }]}>
              {unreadCount} unread
            </Text>
          )}
        </View>

        {unreadCount > 0 && (
          <Pressable
            onPress={handleMarkAllRead}
            disabled={markingAll}
            style={[ns.markAllBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          >
            {markingAll ? (
              <ActivityIndicator size="small" color={theme.colors.primaryLight} />
            ) : (
              <>
                <CheckCheck color={theme.colors.primaryLight} size={14} strokeWidth={2.2} />
                <Text style={[ns.markAllText, { color: theme.colors.primaryLight }]}>Mark all</Text>
              </>
            )}
          </Pressable>
        )}
      </Animated.View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom, paddingTop: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={theme.colors.primaryLight}
          />
        }
      >
        {isLoading ? (
          <View style={{ paddingHorizontal: Spacing.page.horizontal, gap: 10, marginTop: 8 }}>
            {[...Array(5)].map((_, i) => <NotifSkeleton key={i} />)}
          </View>
        ) : notifications.length === 0 ? (
          <Animated.View entering={FadeIn.duration(400)} style={ns.emptyState}>
            <View style={[ns.emptyIconWrap, { backgroundColor: theme.colors.primaryMuted }]}>
              <Bell color={theme.colors.primaryLight} size={32} strokeWidth={1.5} />
            </View>
            <Text style={[Typography.headline.md, { color: theme.colors.textPrimary, marginTop: 16 }]}>
              All caught up!
            </Text>
            <Text style={[Typography.body.sm, { color: theme.colors.textTertiary, marginTop: 6, textAlign: 'center' }]}>
              No notifications yet.{'\n'}Check back later for updates.
            </Text>
          </Animated.View>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <View key={date}>
              <Text style={[ns.dateHeader, { color: theme.colors.textTertiary }]}>{date}</Text>
              <View style={{ paddingHorizontal: Spacing.page.horizontal, gap: 8 }}>
                {items.map((notif, i) => (
                  <NotifCard
                    key={notif.id}
                    notif={notif}
                    index={i}
                    onRead={(id) => markRead(id)}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const ns = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.circle,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateHeader: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.page.horizontal,
    paddingVertical: 10,
    marginTop: 6,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    overflow: 'hidden',
  },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    gap: 5,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.circle,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
    lineHeight: 19,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cardTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  skeletonCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  skeletonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
