import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Linking, Pressable, AppState, AppStateStatus } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Bell, FileText, Calendar, Trophy, AlertTriangle, ExternalLink, Activity } from 'lucide-react-native';
import { useMakautFeedStore } from '@/store/makaut-feed.store';
import { type MakautFeedItem } from '@/api/makaut-feed.api';
import { useTheme } from '@/context/ThemeContext';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { GlassCard } from '@/components/ui';

function getRelativeTime(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

const getTypeConfig = (type: MakautFeedItem['type']) => {
  switch (type) {
    case 'notice': return { icon: FileText, color: '#3B82F6', label: 'Notice' };
    case 'exam_form': return { icon: AlertTriangle, color: '#F59E0B', label: 'Exam Form' };
    case 'result': return { icon: Trophy, color: '#10B981', label: 'Result' };
    case 'schedule': return { icon: Calendar, color: '#8B5CF6', label: 'Schedule' };
    case 'announcement': return { icon: Bell, color: '#6366F1', label: 'Announcement' };
    default: return { icon: Bell, color: '#6B7280', label: 'Update' };
  }
};

const FeedItemCard = ({ item, index }: { item: MakautFeedItem; index: number }) => {
  const { theme, isDark } = useTheme();
  const { markAsRead, readItems } = useMakautFeedStore();
  
  const isRead = !!readItems[item.id];
  const { icon: Icon, color, label } = getTypeConfig(item.type);
  const timeAgo = getRelativeTime(item.date_published);

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markAsRead(item.id);
    if (item.url) {
      if (item.url.endsWith('.pdf')) {
        // Open PDF in browser or viewer
        await WebBrowser.openBrowserAsync(item.url);
      } else {
        // Normal URL
        await Linking.openURL(item.url);
      }
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 50).springify()}>
      <Pressable onPress={handlePress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        <GlassCard 
          intensity={isDark ? 15 : 40} 
          style={[styles.card, !isRead && styles.unreadCard]}
        >
          {/* Header Row */}
          <View style={styles.cardHeader}>
            <View style={[styles.typeBadge, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
              <Icon color={color} size={12} strokeWidth={2.5} />
              <Text style={[styles.typeText, { color }]}>{label}</Text>
            </View>
            <Text style={[Typography.label.xs, { color: theme.colors.textTertiary }]}>{timeAgo}</Text>
          </View>
          
          {/* Title */}
          <Text style={[Typography.headline.sm, styles.title, { color: theme.colors.textPrimary }]}>
            {item.title}
          </Text>

          {/* Footer Row */}
          <View style={styles.cardFooter}>
            {item.priority === 'urgent' && (
              <View style={[styles.priorityBadge, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                <Text style={styles.priorityText}>URGENT</Text>
              </View>
            )}
            <View style={{ flex: 1 }} />
            {item.url && (
              <View style={styles.linkWrap}>
                <Text style={[Typography.label.sm, { color: theme.colors.primary }]}>View</Text>
                <ExternalLink color={theme.colors.primary} size={14} style={{ marginLeft: 4 }} />
              </View>
            )}
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
};

export function MakautFeedList() {
  const { theme } = useTheme();
  const { items, isLoading, fetchFeed } = useMakautFeedStore();
  const appState = useRef(AppState.currentState);

  // Initial fetch and AppState listener for auto-refresh
  useEffect(() => {
    fetchFeed();

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground, auto-refresh the feed
        fetchFeed();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [fetchFeed]);

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchFeed(true); // Force refresh
  };

  if (items.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Activity color={theme.colors.textTertiary} size={32} />
        <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 12 }]}>
          No updates from MAKAUT available at the moment.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.listContent}>
      {items.map((item, index) => (
        <FeedItemCard key={item.id} item={item} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.page.horizontal,
    gap: 12,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1', // Primary color to indicate unread
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    letterSpacing: -0.2,
    lineHeight: 22,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
  },
  linkWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
