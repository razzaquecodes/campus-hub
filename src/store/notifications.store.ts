import { create } from 'zustand';
import type { Notification } from '@/api/notifications.api';

// Extended category types for the showcase UI
export type ShowcaseCategory = 'result' | 'ca_marks' | 'backlog' | 'announcement' | 'academic_update';

export interface ShowcaseNotification extends Omit<Notification, 'category'> {
  category: ShowcaseCategory | Notification['category'];
}

interface NotificationsState {
  notifications: ShowcaseNotification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const DEMO_NOTIFICATIONS: ShowcaseNotification[] = [
  {
    id: 'n1',
    user_id: 'demo-user',
    title: 'Semester 4 Results Published',
    body: 'Your B.Tech CSE Semester 4 regular examination results have been declared. Tap to view your SGPA and detailed scorecard.',
    category: 'result',
    is_read: false,
    action_url: '/results',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
  },
  {
    id: 'n2',
    user_id: 'demo-user',
    title: 'CA4 Marks Updated',
    body: 'Continuous Assessment 4 marks for Data Structures & Algorithms have been updated by Dr. Arindam Roy.',
    category: 'ca_marks',
    is_read: false,
    action_url: '/(tabs)',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'n3',
    user_id: 'demo-user',
    title: 'Upcoming Backlog Exam Registration',
    body: 'Registration for odd semester backlog examinations will close in 3 days. Please complete your fee payment.',
    category: 'backlog',
    is_read: true,
    action_url: '/backlogs',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: 'n4',
    user_id: 'demo-user',
    title: 'Campus Closed for Holidays',
    body: 'The institution will remain closed from Oct 20 to Oct 25 on account of the upcoming festive season.',
    category: 'announcement',
    is_read: true,
    action_url: '/announcements',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  },
  {
    id: 'n5',
    user_id: 'demo-user',
    title: 'Revised Academic Calendar',
    body: 'The academic calendar for the even semester has been updated to accommodate the sports meet.',
    category: 'academic_update',
    is_read: true,
    action_url: '/(tabs)',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), // 5 days ago
  },
];

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: DEMO_NOTIFICATIONS,
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
