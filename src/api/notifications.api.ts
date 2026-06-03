import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  category: 'general' | 'announcement' | 'event' | 'attendance' | 'assignment' | 'placement' | 'result';
  is_read: boolean;
  action_url?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data as Notification[];
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
}

export async function getUnreadCount(userId: string): Promise<number> {
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  return error ? 0 : (count ?? 0);
}

export async function insertNotification(notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>): Promise<void> {
  if (!supabase) return;
  await supabase.from('notifications').insert([
    {
      ...notification,
      is_read: false,
    }
  ]);
}
