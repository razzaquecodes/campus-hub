import { useCallback, useEffect, useRef } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';

/**
 * Subscribe to realtime announcement INSERTs.
 *
 * When a new announcement lands in the DB, `onInsert` is called so the
 * caller can trigger a refetch (React Query `refetch()` or similar).
 *
 * Audience filtering is intentionally done CLIENT-SIDE after the refetch
 * (inside `listAnnouncementsForProfile`) so that no Supabase filter is
 * needed here and the subscription stays simple.
 *
 * Requirements:
 *  - Realtime must be enabled for `announcements` table in Supabase Dashboard
 *    (Database → Replication → Source) OR via migration:
 *    ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
 */
export function useRealtimeAnnouncements(onInsert: () => void) {
  const profile = useAuthStore((s) => s.profile);
  // Stable ref so channel isn't re-created when onInsert identity changes
  const onInsertRef = useRef(onInsert);
  useEffect(() => { onInsertRef.current = onInsert; }, [onInsert]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // Unique channel name to avoid duplicate subscription errors in StrictMode
    const channelName = `announcements_feed_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        () => onInsertRef.current(),
      )
      .subscribe((status) => {
        if (__DEV__) console.log('[realtime][announcements] status:', status);
      });

    return () => {
      void supabase?.removeChannel(channel);
    };
  // Only re-subscribe if Supabase config changes — NOT on every onInsert change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Realtime attendance_sessions changes.
 * Used by the student attendance tab to detect when a faculty starts a session.
 */
export function useRealtimeAttendanceSessions(onChange: () => void) {
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channelName = `attendance_sessions_watch_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_sessions' },
        () => onChangeRef.current(),
      )
      .subscribe((status) => {
        if (__DEV__) console.log('[realtime][attendance_sessions] status:', status);
      });

    return () => {
      void supabase?.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * @deprecated Use useRealtimeAttendanceSessions instead.
 * Kept for backward compat with any existing callers.
 */
export function useRealtimeAttendance(onChange: () => void) {
  return useRealtimeAttendanceSessions(onChange);
}
