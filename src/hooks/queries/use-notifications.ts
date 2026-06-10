import { fetchNotifications } from '@/api/notifications.api';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationsStore } from '@/store/notifications.store';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

// Real backend-backed notifications hook with realtime subscription.
export function useNotifications() {
  const setNotifications = useNotificationsStore((s) => s.setNotifications);
  const upsert = useNotificationsStore((s) => s.upsertNotification);
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    let channel: any = null;
    let mounted = true;
    const userId = profile?.id;
    if (!userId || !supabase) return;

    // Initial fetch
    (async () => {
      try {
        const items = await fetchNotifications(userId);
        if (!mounted) return;
        setNotifications(items as any);
      } catch (e) {
        console.warn('[useNotifications] fetch failed', e);
      }
    })();

    // Subscribe to new notifications for this user
    try {
      channel = supabase.channel(`public:notifications:user:${userId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
          const newItem = payload.new as any;
          upsert(newItem);

          // Only present local notification for certain categories
          const important = ['result', 'ca_marks', 'announcement', 'academic_update', 'notice'];
          if (important.includes(newItem.category)) {
            (async () => {
              try {
                const { status } = await Notifications.getPermissionsAsync();
                if (status !== 'granted') {
                  await Notifications.requestPermissionsAsync();
                }
                await Notifications.scheduleNotificationAsync({
                  content: { title: newItem.title, body: newItem.body, data: { action: newItem.action_url } },
                  trigger: null,
                });
              } catch (e) {
                console.warn('[useNotifications] Failed to show local notification', e);
              }
            })();
          }
        })
        .subscribe();
    } catch (err) {
      console.warn('[useNotifications] subscription failed', err);
    }

    return () => {
      mounted = false;
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (e) {
        // ignore
      }
    };
  }, [profile?.id, setNotifications, upsert]);

  const notifications = useNotificationsStore((s) => s.notifications);
  return {
    data: notifications,
    isLoading: false,
    isError: false,
    isRefetching: false,
    refetch: async () => {
      const userId = profile?.id;
      if (!userId) return;
      const items = await fetchNotifications(userId);
      setNotifications(items as any);
    },
  };
}

export function useUnreadNotificationCount() {
  const notifications = useNotificationsStore((s) => s.notifications);
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  return { data: unreadCount };
}

export function useMarkNotificationRead() {
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  return { mutate: (notificationId: string) => markAsRead(notificationId) };
}

export function useMarkAllNotificationsRead() {
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);
  return { mutate: () => markAllAsRead() };
}
