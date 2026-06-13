import { router } from 'expo-router';
import { ArrowLeft, Bell, BellDot, Check, CheckCircle2, ChevronRight, GraduationCap, Megaphone, Calendar, FileWarning, CalendarClock } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Dimensions, FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SpringButton, ErrorState } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/queries/use-notifications';

import type { ShowcaseNotification } from '@/store/notifications.store';
import { safeBack } from '@/lib/navigation';



function getIconForCategory(category: ShowcaseNotification['category'], color: string) {
  switch (category) {
    case 'result': return <GraduationCap color={color} size={20} />;
    case 'ca_marks': return <CheckCircle2 color={color} size={20} />;
    case 'backlog': return <FileWarning color={color} size={20} />;
    case 'announcement': return <Megaphone color={color} size={20} />;
    case 'academic_update': return <CalendarClock color={color} size={20} />;
    default: return <Bell color={color} size={20} />;
  }
}

function getRelativeTime(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: notifications = [], isLoading, isError, refetch, isRefetching } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  const handlePress = (notif: ShowcaseNotification) => {
    if (!notif.is_read) {
      markRead.mutate(notif.id);
    }
    if (notif.action_url) {
      router.push(notif.action_url as any);
    }
  };

  const renderItem = ({ item, index }: { item: ShowcaseNotification; index: number }) => {
    const isUnread = !item.is_read;
    const catColor = isUnread ? theme.colors.primaryLight : theme.colors.textTertiary;
    const bg = isUnread ? (isDark ? 'rgba(99,102,241,0.06)' : 'rgba(79,70,229,0.04)') : theme.colors.surface;

    return (
      <Animated.View entering={FadeInDown.duration(400).delay(index * 50)} layout={Layout.springify()}>
        <SpringButton onPress={() => handlePress(item)} scaleDown={0.96}>
          <View style={[s.card, { backgroundColor: bg, borderColor: isUnread ? theme.colors.primaryMuted : theme.colors.border }]}>
            <View style={s.cardLeft}>
              <View style={[s.iconBox, { backgroundColor: isUnread ? `${theme.colors.primary}15` : `${theme.colors.textTertiary}15` }]}>
                {getIconForCategory(item.category, catColor)}
              </View>
              {isUnread && <View style={[s.unreadDot, { backgroundColor: theme.colors.primaryLight }]} />}
            </View>
            <View style={s.cardBody}>
              <Text style={[s.title, { color: isUnread ? theme.colors.textPrimary : theme.colors.textSecondary }]}>{item.title}</Text>
              <Text style={[s.bodyText, { color: theme.colors.textSecondary }]} numberOfLines={2}>{item.body}</Text>
              <Text style={[s.time, { color: theme.colors.textTertiary }]}>{getRelativeTime(item.created_at)}</Text>
            </View>
            {item.action_url && <ChevronRight color={theme.colors.textTertiary} size={16} />}
          </View>
        </SpringButton>
      </Animated.View>
    );
  };

  return (
    <View style={[s.root, { backgroundColor: theme.colors.void }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.void} />

      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={[s.header, { paddingTop: insets.top + 8, backgroundColor: theme.colors.void }]}>
        <SpringButton onPress={() => safeBack('/(tabs)')} scaleDown={0.88}>
          <View style={[s.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: theme.colors.glassBorder }]}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2} />
          </View>
        </SpringButton>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: theme.colors.textPrimary }]}>Notifications</Text>
          <Text style={[s.headerSub, { color: theme.colors.textSecondary }]}>{unreadCount} unread</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => markAllRead.mutate()} style={[s.markAllBtn, { backgroundColor: `${theme.colors.primary}15` }]}>
            <Check color={theme.colors.primaryLight} size={16} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* List */}
      <FlatList
        data={notifications}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primaryLight} style={{ marginTop: 40 }} />
          ) : isError ? (
            <View style={{ marginTop: 60 }}>
              <ErrorState 
                title="Unable to Load Notifications"
                message="We could not fetch your notifications. Please check your connection."
                onRetry={refetch}
              />
            </View>
          ) : (
            <Animated.View entering={FadeIn.duration(400)} style={s.emptyState}>
              <View style={[s.emptyIcon, { backgroundColor: `${theme.colors.textTertiary}15` }]}>
                <BellDot color={theme.colors.textTertiary} size={40} />
              </View>
              <Text style={[s.emptyTitle, { color: theme.colors.textPrimary }]}>All Caught Up!</Text>
              <Text style={[s.emptySub, { color: theme.colors.textSecondary }]}>You have no new notifications.</Text>
            </Animated.View>
          )
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.6 },
  headerSub: { fontSize: 13, fontWeight: '500' },
  markAllBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { padding: Spacing.page.horizontal, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  cardLeft: { position: 'relative', marginRight: 14 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#000', // mask hack, usually overridden by layout
  },
  cardBody: { flex: 1, gap: 4 },
  title: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  bodyText: { fontSize: 13, lineHeight: 18 },
  time: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, letterSpacing: -0.4 },
  emptySub: { fontSize: 14 },
});
