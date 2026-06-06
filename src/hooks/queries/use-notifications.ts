import { useNotificationsStore } from '@/store/notifications.store';

// For the Showcase Module, we bypass React Query and Supabase entirely,
// but we keep the identical hook signatures so the UI requires zero changes.
// To revert to real backend integration, simply restore the original React Query + Supabase code.

export function useNotifications() {
  const notifications = useNotificationsStore((s) => s.notifications);
  
  return {
    data: notifications,
    isLoading: false,
    isError: false,
    isRefetching: false,
    refetch: async () => {}, // Mock refetch
  };
}

export function useUnreadNotificationCount() {
  const notifications = useNotificationsStore((s) => s.notifications);
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  
  return {
    data: unreadCount,
  };
}

export function useMarkNotificationRead() {
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  
  return {
    mutate: (notificationId: string) => markAsRead(notificationId),
  };
}

export function useMarkAllNotificationsRead() {
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);
  
  return {
    mutate: () => markAllAsRead(),
  };
}
