import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import {
    fetchNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from '@/api/notifications.api';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';

const notificationsQueryKey = ['notifications'];

export function useNotifications() {
  const profile = useAuthStore((s) => s.profile);
  const userId = profile?.id;

  const query = useQuery({
    queryKey: [...notificationsQueryKey, userId],
    queryFn: async () => fetchNotifications(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    let channel: any = null;
    if (!userId || !supabase) return undefined;

    const subscribe = async () => {
      try {
        channel = supabase
          .channel(`public:notifications:user:${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`,
            },
            async (payload) => {
              const newItem = payload.new as any;
              query.refetch();

              const important = ['result', 'ca_marks', 'announcement', 'academic_update', 'notice'];
              if (important.includes(newItem.category)) {
                try {
                  const { status } = await Notifications.getPermissionsAsync();
                  if (status !== 'granted') {
                    await Notifications.requestPermissionsAsync();
                  }
                  await Notifications.scheduleNotificationAsync({
                    content: {
                      title: newItem.title,
                      body: newItem.body,
                      data: { actionUrl: newItem.action_url },
                    },
                    trigger: null,
                  });
                } catch (e) {
                  console.warn('[useNotifications] Failed to schedule local notification', e);
                }
              }
            },
          )
          .subscribe();
      } catch (err) {
        console.warn('[useNotifications] subscription failed', err);
      }
    };

    subscribe();

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  }, [query, userId]);

  return query;
}

export function useUnreadNotificationCount() {
  const { data } = useNotifications();
  const unreadCount = data?.filter((notification) => !notification.is_read).length ?? 0;
  return { data: unreadCount };
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const profile = useAuthStore((s) => s.profile);
  const userId = profile?.id;

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: () => {
      if (userId) {
        qc.invalidateQueries({ queryKey: [...notificationsQueryKey, userId] });
      } else {
        qc.invalidateQueries({ queryKey: notificationsQueryKey });
      }
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const profile = useAuthStore((s) => s.profile);
  const userId = profile?.id;

  return useMutation({
    mutationFn: async () => {
      if (!userId) return;
      await markAllNotificationsRead(userId);
    },
    onSuccess: () => {
      if (userId) {
        qc.invalidateQueries({ queryKey: [...notificationsQueryKey, userId] });
      } else {
        qc.invalidateQueries({ queryKey: notificationsQueryKey });
      }
    },
  });
}
