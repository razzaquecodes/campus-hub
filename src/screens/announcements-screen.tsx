import { useQueryClient } from '@tanstack/react-query';
import { Pin } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AmbientBackground } from '@/components/ui/ambient-background';
import { GlassPanel } from '@/components/ui/glass-panel';
import { OsText } from '@/components/ui/os-text';
import { Theme } from '@/constants/theme';
import {
  announcementKeys,
  useAnnouncements,
  useMarkAnnouncementRead,
} from '@/hooks/queries/use-announcements';
import { useRealtimeAnnouncements } from '@/hooks/use-realtime';
import type { Announcement } from '@/types/database';

const PRIORITY_COLOR: Record<Announcement['priority'], string> = {
  low: Theme.colors.textTertiary,
  normal: Theme.colors.accent,
  high: Theme.colors.warning,
  urgent: Theme.colors.danger,
};

export function AnnouncementsScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data = [], isLoading, refetch, isRefetching } = useAnnouncements();
  const markRead = useMarkAnnouncementRead();

  const onRealtime = useCallback(() => {
    qc.invalidateQueries({ queryKey: announcementKeys.all });
  }, [qc]);
  useRealtimeAnnouncements(onRealtime);

  const sorted = [...data].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <AmbientBackground>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Theme.colors.primary}
          />
        }
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 110,
          paddingHorizontal: Theme.spacing.lg,
        }}
        ListHeaderComponent={
          <Animated.View entering={FadeInDown.duration(400)}>
            <OsText variant="hero" style={styles.title}>
              Announcements
            </OsText>
            <OsText variant="caption" muted style={styles.sub}>
              Scoped to your branch, semester & subjects
            </OsText>
          </Animated.View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).duration(350)}>
            <GlassPanel
              onPress={() => markRead.mutate(item.id)}
              style={[styles.card, !item.read && styles.unread]}>
              <View style={styles.cardTop}>
                {item.is_pinned ? <Pin size={14} color={Theme.colors.primaryLight} /> : null}
                <View style={[styles.dot, { backgroundColor: PRIORITY_COLOR[item.priority] }]} />
                <OsText variant="micro" muted style={styles.scope}>
                  {item.scope.toUpperCase()}
                </OsText>
              </View>
              <OsText variant="subtitle" style={styles.cardTitle}>
                {item.title}
              </OsText>
              <OsText variant="caption" muted numberOfLines={3}>
                {item.body}
              </OsText>
              <OsText variant="micro" muted style={styles.meta}>
                {item.author_name} · {formatRelative(item.created_at)}
              </OsText>
            </GlassPanel>
          </Animated.View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <OsText variant="body" muted style={styles.empty}>
              No announcements yet.
            </OsText>
          ) : null
        }
      />
    </AmbientBackground>
  );
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const styles = StyleSheet.create({
  title: { marginBottom: 4 },
  sub: { marginBottom: Theme.spacing.lg },
  card: { marginBottom: Theme.spacing.sm },
  unread: { borderColor: Theme.colors.primary },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  scope: { letterSpacing: 0.6 },
  cardTitle: { marginBottom: 6 },
  meta: { marginTop: 10 },
  empty: { textAlign: 'center', marginTop: 48 },
});
