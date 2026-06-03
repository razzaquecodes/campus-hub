import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BellRing,
  Info,
  Search,
} from 'lucide-react-native';

import { SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';

type Priority = 'normal' | 'important' | 'urgent';

interface AnnouncementRecord {
  id: number;
  title: string;
  message: string;
  priority: Priority;
  created_by: string;
  created_at: string;
  is_active: boolean;
}

export default function StudentAnnouncementsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAnnouncements(data || []);
    } catch (err: any) {
      console.error('[announcements] Fetch error:', err);
      setError(err.message || 'Failed to load announcements.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto fetch on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchAnnouncements();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    fetchAnnouncements();
  }, []);

  // Real-time filtering
  const filteredAnnouncements = useMemo(() => {
    if (!searchQuery.trim()) return announcements;
    const lowerQuery = searchQuery.toLowerCase();
    return announcements.filter(
      (a) =>
        a.title.toLowerCase().includes(lowerQuery) ||
        a.message.toLowerCase().includes(lowerQuery)
    );
  }, [announcements, searchQuery]);

  // Priority Visuals
  const getPriorityVisuals = (p: Priority) => {
    switch (p) {
      case 'urgent':
        return { color: theme.colors.danger, bg: `${theme.colors.danger}15`, Icon: AlertCircle };
      case 'important':
        return { color: theme.colors.warning, bg: `${theme.colors.warning}15`, Icon: AlertTriangle };
      case 'normal':
      default:
        return { color: theme.colors.primary, bg: `${theme.colors.primary}15`, Icon: Info };
    }
  };

  const renderItem = ({ item, index }: { item: AnnouncementRecord; index: number }) => {
    const dateObj = new Date(item.created_at);
    const formattedDate = dateObj.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const { color, bg, Icon } = getPriorityVisuals(item.priority);

    return (
      <Animated.View
        entering={FadeInDown.duration(300).delay(Math.min(index * 50, 500))}
        layout={Layout}
        style={[ss.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      >
        <View style={ss.cardHeader}>
          <View style={[ss.iconRing, { backgroundColor: bg }]}>
            <Icon color={color} size={24} />
          </View>
          <View style={ss.cardHeaderContent}>
            <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={[ss.priorityBadge, { backgroundColor: bg }]}>
              <Text style={[Typography.label.sm, { color, textTransform: 'capitalize' }]}>
                {item.priority}
              </Text>
            </View>
          </View>
        </View>

        <View style={ss.cardBody}>
          <Text style={[Typography.body.md, { color: theme.colors.textSecondary, lineHeight: 22 }]}>
            {item.message}
          </Text>
        </View>

        <View style={[ss.cardFooter, { borderTopColor: theme.colors.border }]}>
          <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}>
            Published on {formattedDate}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderEmptyComponent = () => {
    if (loading && !refreshing) {
      return (
        <View style={ss.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={[ss.emptyState, { borderColor: theme.colors.danger, backgroundColor: `${theme.colors.danger}10` }]}>
          <BellRing color={theme.colors.danger} size={32} />
          <Text style={[Typography.body.md, { color: theme.colors.danger, marginTop: 12, textAlign: 'center' }]}>
            {error}
          </Text>
          <SpringButton onPress={onRefresh} scaleDown={0.95}>
            <View style={[ss.retryBtn, { backgroundColor: theme.colors.danger }]}>
              <Text style={[Typography.label.md, { color: '#FFFFFF' }]}>Try Again</Text>
            </View>
          </SpringButton>
        </View>
      );
    }

    if (announcements.length === 0) {
      return (
        <View style={[ss.emptyState, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <BellRing color={theme.colors.textTertiary} size={32} />
          <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 12 }]}>
            No announcements available
          </Text>
        </View>
      );
    }

    return (
      <View style={[ss.emptyState, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <Search color={theme.colors.textTertiary} size={32} />
        <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 12 }]}>
          No results found for "{searchQuery}"
        </Text>
      </View>
    );
  };

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      {/* HEADER */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[ss.header, { paddingTop: insets.top + 16 }]}
      >
        <SpringButton
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            router.back();
          }}
          scaleDown={0.88}
        >
          <View
            style={[
              ss.backBtn,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                borderColor: theme.colors.glassBorder,
              },
            ]}
          >
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2} />
          </View>
        </SpringButton>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[Typography.display.small, { color: theme.colors.textPrimary }]}>
            Announcements
          </Text>
          <Text style={[Typography.body.sm, { color: theme.colors.textSecondary }]}>
            Campus Updates & Alerts
          </Text>
        </View>
      </Animated.View>

      {/* SEARCH BAR */}
      <Animated.View entering={FadeInDown.duration(400).delay(50)} style={ss.searchContainer}>
        <View style={[ss.searchBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Search color={theme.colors.textTertiary} size={20} style={{ marginRight: 8 }} />
          <TextInput
            style={[Typography.body.md, ss.searchInput, { color: theme.colors.textPrimary }]}
            placeholder="Search announcements..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </Animated.View>

      <FlatList
        data={filteredAnnouncements}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={[ss.listContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: Spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: Spacing.sm,
    flexGrow: 1,
    gap: Spacing.lg,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: Spacing.xl,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    marginTop: Spacing.lg,
    ...Shadows.float,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    ...Shadows.cardLight,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  iconRing: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardHeaderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    marginTop: 6,
  },
  cardBody: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  cardFooter: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
});
