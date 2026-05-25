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
      // that fire during hydration
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
            // Guard against concurrent profile loads
            if (profileLoading.current) {
              hydratorLog('Profile load already in progress — skipping duplicate');
              return;
            }

            profileLoading.current = true;
            try {
              hydratorLog('Loading profile after auth state change...');
              const profile = await getPersistedSession();
              if (mounted && profile) {
                hydratorLog('Profile loaded after auth state change', {
                  userId: profile.id,
                  email: profile.email,
                });
                setProfile(profile);

                // Load MAKAUT profile too
                try {
                  const mProfile = await getMakautProfile(profile.id);
                  if (mounted) {
                    hydratorLog('MAKAUT profile loaded after auth state change', {
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
                hydratorLog('Profile load returned null after SIGNED_IN');
              }
            } catch (e) {
              hydratorLog('Profile load failed after auth state change (non-fatal)', {
                error: e instanceof Error ? e.message : String(e),
              });
            } finally {
              profileLoading.current = false;
            }
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
      // async, so we wait for getSession() to resolve before marking hydration
      // done — prevents the race condition that flashes the login screen.
      try {
        hydratorLog('Step 1: Checking for persisted session...');
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          hydratorLog('Persisted session found', {
            userId: session.user.id,
            email: session.user.email,
          });

          // Only load profile during hydration if we're not already loading
          // (to avoid duplicate load if onAuthStateChange fires immediately)
          if (!profileLoading.current) {
            profileLoading.current = true;
            try {
              const profile = await getPersistedSession();
              if (mounted && profile) {
                hydratorLog('Profile loaded from persisted session', {
                  userId: profile.id,
                  email: profile.email,
                });
                setProfile(profile);

                // Also load MAKAUT profile during hydration
                try {
                  const mProfile = await getMakautProfile(profile.id);
                  if (mounted) {
                    hydratorLog('MAKAUT profile loaded during hydration', {
                      hasMakaut: Boolean(mProfile),
                    });
                    setMakautProfile(mProfile);
                  }
                } catch (e) {
                  hydratorLog('MAKAUT profile load failed during hydration (non-fatal)', {
                    error: e instanceof Error ? e.message : String(e),
                  });
                }
              } else if (mounted) {
                hydratorLog('Profile load returned null despite session existing');
              }
            } finally {
              profileLoading.current = false;
            }
          }
        } else {
          hydratorLog('No persisted session found');
        }
      } catch (e) {
        hydratorLog('Session restore failed (non-fatal)', {
          error: e instanceof Error ? e.message : String(e),
        });
      } finally {
        if (mounted) {
          hydratorLog('Hydration complete — marking isHydrated=true');
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
