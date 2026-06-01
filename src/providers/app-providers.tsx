/**
 * app-providers.tsx
 *
 * Application-level providers and auth hydration.
 *
 * AuthHydrator responsibilities (post-MAKAUT migration):
 *   1. On mount, call useStudentStore.restoreSession() to rehydrate from
 *      SecureStore/AsyncStorage.
 *   2. Once restored, if a student session exists, map it to a UserProfile
 *      and set it in useAuthStore so the existing navigation guard and all
 *      existing dashboard screens continue to work unchanged.
 *   3. Mark useAuthStore.isHydrated = true so the splash screen is dismissed
 *      and the auth guard can make its navigation decision.
 *
 * What was removed:
 *   - supabase.auth.onAuthStateChange listener (no longer using Supabase Auth)
 *   - getPersistedSession() calls (replaced by restoreSession())
 *   - getMakautProfile() call (student data is now in StudentModel itself)
 */

import { QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useRef } from 'react';

import { queryClient } from '@/lib/query-client';
import { mapStudentToUserProfile, useAuthStore } from '@/store/auth.store';
import { useStudentStore } from '@/store/student.store';

function hydratorLog(message: string, details?: Record<string, unknown>) {
  const ts = new Date().toISOString().slice(11, 23);
  const payload = details ? ` ${JSON.stringify(details)}` : '';
  console.info(`[hydrator][${ts}] ${message}${payload}`);
}

function AuthHydrator({ children }: { children: React.ReactNode }) {
  const setProfile = useAuthStore((s) => s.setProfile);
  const setIsHydrated = useAuthStore((s) => s.setIsHydrated);
  const restoreSession = useStudentStore((s) => s.restoreSession);
  const studentIsHydrated = useStudentStore((s) => s.isHydrated);
  const student = useStudentStore((s) => s.student);

  // Guard against re-running on every render
  const initStarted = useRef(false);

  // ── Step 1: Trigger student session restore on mount ───────────────────────
  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    hydratorLog('AuthHydrator: starting MAKAUT session restore');
    restoreSession().catch((e) => {
      hydratorLog('AuthHydrator: restoreSession threw (non-fatal)', {
        error: e instanceof Error ? e.message : String(e),
      });
    });
  }, [restoreSession]);

  // ── Step 2: Once student store is hydrated, sync to auth store ─────────────
  // This runs whenever studentIsHydrated or student changes.
  useEffect(() => {
    if (!studentIsHydrated) return;

    if (student) {
      hydratorLog('AuthHydrator: student session found — mapping to UserProfile', {
        rollNumber: student.rollNumber,
        instituteName: student.instituteName,
      });
      const userProfile = mapStudentToUserProfile(student);
      setProfile(userProfile);
    } else {
      hydratorLog('AuthHydrator: no student session — clearing profile');
      setProfile(null);
    }

    // Mark auth store as hydrated AFTER profile is set to prevent the
    // race condition where isHydrated=true but profile=null flashes login.
    hydratorLog('AuthHydrator: marking isHydrated=true');
    setIsHydrated(true);
  }, [studentIsHydrated, student, setProfile, setIsHydrated]);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator>{children}</AuthHydrator>
    </QueryClientProvider>
  );
}
