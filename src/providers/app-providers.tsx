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

import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import React, { useEffect, useRef } from 'react';

import { Env } from '@/lib/env';
import { asyncStoragePersister, queryClient } from '@/lib/query-client';
import { BackendFaceProvider } from '@/repositories/face.backend.provider';
import { FaceService } from '@/repositories/face.service';
import { resolveMasterProfile } from '@/services/profile.service';
import { mapStudentToUserProfile, useAuthStore } from '@/store/auth.store';
import { useStudentStore } from '@/store/student.store';
import { useProfileStore } from '@/store/useProfileStore';
import { useAdminStore } from '@/store/admin.store';
import { useFacultyStore } from '@/store/faculty.store';
import { supabase } from '@/lib/supabase';

function hydratorLog(message: string, details?: Record<string, unknown>) {
  const ts = new Date().toISOString().slice(11, 23);
  const payload = details ? ` ${JSON.stringify(details)}` : '';
  console.info(`[hydrator][${ts}] ${message}${payload}`);
}

function AuthHydrator({ children }: { children: React.ReactNode }) {
  const setProfile = useAuthStore((s) => s.setProfile);
  const setIsHydrated = useAuthStore((s) => s.setIsHydrated);
  const setMasterProfile = useProfileStore((s) => s.setProfile);
  const clearMasterProfile = useProfileStore((s) => s.clearProfile);
  const restoreSession = useStudentStore((s) => s.restoreSession);
  const studentIsHydrated = useStudentStore((s) => s.isHydrated);
  const student = useStudentStore((s) => s.student);

  // Guard against re-running on every render
  const initStarted = useRef(false);

  // ── Step 1: Trigger student session restore on mount ───────────────────────
  useEffect(() => {
    if (initStarted.current) {
      hydratorLog('AuthHydrator: init already started — skipping');
      return;
    }
    initStarted.current = true;

    hydratorLog('AuthHydrator: starting MAKAUT session restore');

    // Wrap in timeout to ensure we don't hang forever
    const timeoutId = setTimeout(() => {
      hydratorLog('AuthHydrator: timeout reached — forcing hydration');
      setIsHydrated(true);
    }, 5000); // 5 second fallback

    const hydrateFaculty = async () => {
      try {
        if (!supabase) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const email = session.user.email.trim().toLowerCase();
          
          const netInfo = await NetInfo.fetch();
          if (!netInfo.isConnected) {
             // Offline: Rely on Zustand persist to provide the profile
             hydratorLog('AuthHydrator: offline, relying on persisted faculty state');
             return;
          }

          const { data: facultyRow } = await supabase
            .from('faculty')
            .select('id, full_name, department, designation, email, phone, created_at')
            .eq('email', email)
            .limit(1)
            .single();

          if (facultyRow) {
            useFacultyStore.getState().setProfile({
              id: facultyRow.id,
              name: facultyRow.full_name,
              department: facultyRow.department,
              designation: facultyRow.designation,
              employeeId: facultyRow.id,
              email: facultyRow.email || email,
              phone: facultyRow.phone || '',
              joiningDate: facultyRow.created_at,
            });
            useAdminStore.getState().setAdmin(email);
            hydratorLog('AuthHydrator: faculty session restored');
          }
        }
      } catch (e) {
        hydratorLog('AuthHydrator: faculty hydrate failed', { error: String(e) });
      }
    };

    Promise.all([restoreSession(), hydrateFaculty()])
      .then(() => {
        hydratorLog('AuthHydrator: restore sessions completed');
      })
      .catch((e) => {
        hydratorLog('AuthHydrator: restore sessions threw (non-fatal)', {
          error: e instanceof Error ? e.message : String(e),
        });
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });
  }, [restoreSession, setIsHydrated]);

  // ── Step 2: Once student store is hydrated, sync to auth store ─────────────
  // This runs whenever studentIsHydrated or student changes.
  useEffect(() => {
    hydratorLog('AuthHydrator: sync effect running', {
      studentIsHydrated,
      hasStudent: Boolean(student),
    });

    if (!studentIsHydrated) {
      hydratorLog('AuthHydrator: student store not hydrated yet — waiting');
      return;
    }

    if (student) {
      hydratorLog('AuthHydrator: student session found — mapping to UserProfile', {
        rollNumber: student.rollNumber,
        instituteName: student.instituteName,
      });
      const userProfile = mapStudentToUserProfile(student);
      setProfile(userProfile);
      const masterProfile = resolveMasterProfile(student, userProfile);
      if (masterProfile) setMasterProfile(masterProfile);
    } else {
      hydratorLog('AuthHydrator: no student session — clearing profile');
      setProfile(null);
      clearMasterProfile();
    }

    // Mark auth store as hydrated AFTER profile is set to prevent the
    // race condition where isHydrated=true but profile=null flashes login.
    hydratorLog('AuthHydrator: marking isHydrated=true');
    setIsHydrated(true);
  }, [studentIsHydrated, student, setProfile, setIsHydrated, setMasterProfile, clearMasterProfile]);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  // Configure runtime providers that depend on environment
  React.useEffect(() => {
    if (Env.faceServiceUrl) {
      console.info('[AppProviders] Configuring backend face provider', { url: Env.faceServiceUrl });
      FaceService.setProvider(new BackendFaceProvider());
    }

    // Refresh academic data whenever app becomes active (user opens app)
    const handleAppState = (nextState: string) => {
      if (nextState === 'active') {
        console.info('[AppProviders] App active — invalidating queries to refresh academic data');
        try {
          queryClient.invalidateQueries();
        } catch (e) {
          console.warn('[AppProviders] Failed invalidateQueries', e);
        }
      }
    };

    // Use AppState from react-native
    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, []);

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
      <AuthHydrator>{children}</AuthHydrator>
    </PersistQueryClientProvider>
  );
}
