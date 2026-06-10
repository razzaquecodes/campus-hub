import type { Notification } from '@/api/notifications.api';
import { create } from 'zustand';

// Extended category types for the showcase UI
export type ShowcaseCategory = 'result' | 'ca_marks' | 'backlog' | 'announcement' | 'academic_update';

export interface ShowcaseNotification extends Omit<Notification, 'category'> {
  category: ShowcaseCategory | Notification['category'];
}

interface NotificationsState {
  notifications: ShowcaseNotification[];
  setNotifications: (items: ShowcaseNotification[]) => void;
  upsertNotification: (item: ShowcaseNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const INITIAL_NOTIFICATIONS: ShowcaseNotification[] = [];

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: INITIAL_NOTIFICATIONS,
  setNotifications: (items) => set({ notifications: items }),
  upsertNotification: (item) =>
    set((state) => {
      const exists = state.notifications.find((n) => n.id === item.id);
      if (exists) {
        return { notifications: state.notifications.map((n) => (n.id === item.id ? { ...n, ...item } : n)) };
      }
      return { notifications: [item, ...state.notifications].slice(0, 200) };
    }),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
    })),
}));
