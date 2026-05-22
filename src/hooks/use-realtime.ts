import { useEffect } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';

/**
 * Subscribe to realtime announcement inserts for the logged-in user.
 * Enable replication on `announcements` in Supabase Dashboard.
 *
 * Push notifications: use `notifications` table + Edge Function → Expo Push API.
 */
export function useRealtimeAnnouncements(onInsert: () => void) {
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !profile) return;

    const channel = supabase
      .channel(`announcements:${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        () => onInsert(),
      )
      .subscribe();

    return () => {
      void supabase?.removeChannel(channel);
    };
  }, [profile, onInsert]);
}

/**
 * Realtime attendance updates when teacher marks attendance.
 * Enable replication on `attendance` table.
 */
export function useRealtimeAttendance(onChange: () => void) {
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !profile) return;

    const channel = supabase
      .channel(`attendance:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `user_id=eq.${profile.id}`,
        },
        () => onChange(),
      )
      .subscribe();

    return () => {
      void supabase?.removeChannel(channel);
    };
  }, [profile, onChange]);
}
