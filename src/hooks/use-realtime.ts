import { useEffect, useRef } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

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
 * Subscribe to realtime notice INSERTs.
 * This is for notices published by faculty.
 */
export function useRealtimeNotices(onInsert: () => void) {
  const onInsertRef = useRef(onInsert);
  useEffect(() => { onInsertRef.current = onInsert; }, [onInsert]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channelName = `notices_feed_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notices' },
        () => onInsertRef.current(),
      )
      .subscribe((status) => {
        if (__DEV__) console.log('[realtime][notices] status:', status);
      });

    return () => {
      void supabase?.removeChannel(channel);
    };
  }, []);
}

/**
 * Subscribe to realtime notifications for the current user.
 * This powers the main "Campus Hub Feed".
 *
 * RLS policy must be in place: "users_own_notifications_select"
 */
export function useRealtimeNotifications(onInsert: () => void) {
  const onInsertRef = useRef(onInsert);
  useEffect(() => { onInsertRef.current = onInsert; }, [onInsert]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channelName = `notifications_feed_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => onInsertRef.current(),
      )
      .subscribe((status) => {
        if (__DEV__) console.log('[realtime][notifications] status:', status);
      });

    return () => {
      void supabase?.removeChannel(channel);
    };
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
