import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notifications.api';
import { useAuthStore } from '@/store/auth.store';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId?: string) => [...notificationKeys.all, userId] as const,
  unread: (userId?: string) => [...notificationKeys.all, 'unread', userId] as const,
};

export function useNotifications() {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: notificationKeys.list(profile?.id),
    enabled: !!profile?.id && profile.id !== 'guest-id',
    queryFn: () => fetchNotifications(profile!.id),
    staleTime: 30_000, // 30s
  });
}

export function useUnreadNotificationCount() {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: notificationKeys.unread(profile?.id),
    enabled: !!profile?.id && profile.id !== 'guest-id',
    queryFn: () => getUnreadCount(profile!.id),
    staleTime: 30_000,
    refetchInterval: 60_000, // Poll every 60s
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const profile = useAuthStore((s) => s.profile);

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const profile = useAuthStore((s) => s.profile);

  return useMutation({
    mutationFn: () => markAllNotificationsRead(profile!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
