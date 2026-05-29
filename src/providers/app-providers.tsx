import { QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useRef } from 'react';

import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';
import { getPersistedSession } from '@/services/auth.service';
import { getMakautProfile } from '@/services/makaut.service';
import { useAuthStore } from '@/store/auth.store';

function hydratorLog(message: string, details?: Record<string, unknown>) {
  const ts = new Date().toISOString().slice(11, 23);
  const payload = details ? ` ${JSON.stringify(details)}` : '';
  console.info(`[hydrator][${ts}] ${message}${payload}`);
}

function AuthHydrator({ children }: { children: React.ReactNode }) {
  const setProfile = useAuthStore((s) => s.setProfile);
  const setMakautProfile = useAuthStore((s) => s.setMakautProfile);
  const setIsHydrated = useAuthStore((s) => s.setIsHydrated);

  // Concurrency guard: prevents multiple simultaneous getPersistedSession() calls
  const profileLoading = useRef(false);

  useEffect(() => {
    let mounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    // ── Helper: load profile + MAKAUT profile, then mark hydrated ──────────────
    // This is extracted so we can call it from BOTH the onAuthStateChange handler
    // AND the initial getSession() check, with consistent behaviour.
    //
    // KEY FIX for Race Condition RC-1:
    //   setIsHydrated(true) is called INSIDE this function, AFTER setProfile().
    //   This prevents the window where isHydrated=true but profile=null, which
    //   caused index.tsx to flash the login screen for authenticated users.
    //
    const loadProfileAndMarkHydrated = async (markHydrated: boolean) => {
      if (profileLoading.current) {
        hydratorLog('Profile load already in progress — skipping duplicate');
        return;
      }

      profileLoading.current = true;
      try {
        hydratorLog('Loading profile...');
        const profile = await getPersistedSession();
        if (mounted && profile) {
          hydratorLog('Profile loaded', {
            userId: profile.id,
            email: profile.email,
          });
          setProfile(profile);

          // Load MAKAUT profile (non-fatal if it fails)
          try {
            const mProfile = await getMakautProfile(profile.id);
            if (mounted) {
              hydratorLog('MAKAUT profile loaded', {
                hasMakaut: Boolean(mProfile),
              });
              setMakautProfile(mProfile);
            }
          } catch (e) {
            hydratorLog('MAKAUT profile load failed (non-fatal)', {
              error: e instanceof Error ? e.message : String(e),
            });
          }
        } else if (mounted) {
          const currentProfile = useAuthStore.getState().profile;
          if (currentProfile?.id !== 'guest-id') {
            hydratorLog('Profile load returned null');
            setProfile(null);
          } else {
            hydratorLog('Preserving guest profile');
          }
        }
      } catch (e) {
        hydratorLog('Profile load failed (non-fatal)', {
          error: e instanceof Error ? e.message : String(e),
        });
      } finally {
        profileLoading.current = false;
        // Only mark hydrated from this call if requested.
        // The onAuthStateChange path does NOT mark hydrated (the initial
        // getSession() path is responsible for that on cold start).
        if (markHydrated && mounted) {
          hydratorLog('Marking isHydrated=true after profile resolution');
          setIsHydrated(true);
        }
      }
    };

    const initAuth = async () => {
      hydratorLog('initAuth started');

      // No Supabase configured — unblock the app immediately
      if (!supabase) {
        hydratorLog('No Supabase configured — marking hydrated');
        if (mounted) setIsHydrated(true);
        return;
      }

      // ── Step 0: Register auth state listener FIRST ──────────────────────────
      // Must be registered before any async operations to catch events
      // that fire during hydration (e.g. token refresh on startup)
      hydratorLog('Step 0: Registering auth state listener...');
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;

        hydratorLog('onAuthStateChange fired', {
          event,
          hasSession: Boolean(session),
          userId: session?.user?.id ?? null,
        });

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            // Do NOT pass markHydrated=true here: the initial getSession() call
            // below is responsible for setting isHydrated on cold start.
            // For post-login events (e.g. after Google OAuth), isHydrated is
            // already true, so we just need to update the profile.
            await loadProfileAndMarkHydrated(false);
          }
        } else if (event === 'SIGNED_OUT') {
          hydratorLog('User signed out — clearing profile');
          setProfile(null);
          setMakautProfile(null);
        }
      });

      authSubscription = data.subscription;
      hydratorLog('Auth state change listener registered');

      // ── Step 1: Restore any persisted session from storage ──────────────────
      // This runs once on cold start. Supabase reads AsyncStorage / SecureStore
      // async, so we wait for getSession() to resolve before deciding whether
      // to load the profile.
      //
      // KEY FIX for RC-1: isHydrated is only set after profile resolution,
      // never before. This is handled inside loadProfileAndMarkHydrated().
      try {
        hydratorLog('Step 1: Checking for persisted session...');
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          hydratorLog('Persisted session found', {
            userId: session.user.id,
            email: session.user.email,
          });

          // Load profile and mark hydrated after it resolves.
          // markHydrated=true ensures isHydrated is set only after profile is loaded.
          await loadProfileAndMarkHydrated(true);
        } else {
          hydratorLog('No persisted session found');
          // No session — mark hydrated immediately (nothing to load)
          if (mounted) {
            hydratorLog('No session — marking isHydrated=true immediately');
            setIsHydrated(true);
          }
        }
      } catch (e) {
        hydratorLog('Session restore failed (non-fatal)', {
          error: e instanceof Error ? e.message : String(e),
        });
        // Even on error, mark hydrated so app doesn't hang on splash
        if (mounted) {
          hydratorLog('Error path — marking isHydrated=true');
          setIsHydrated(true);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
      authSubscription?.unsubscribe();
      hydratorLog('AuthHydrator unmounted — subscription cleaned up');
    };
  }, [setProfile, setMakautProfile, setIsHydrated]);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator>{children}</AuthHydrator>
    </QueryClientProvider>
  );
}
