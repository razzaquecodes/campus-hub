/**
 * auth.store.ts
 *
 * Zustand auth store.
 *
 * Lifecycle:
 *  App boot → hydrate() → reads Supabase session + cached profile
 *           → sets isHydrated = true (gates routing in _layout.tsx)
 *
 *  Sign-in  → signIn(credentials) → calls auth.service → persists profile
 *  Sign-out → signOut() → clears everything
 *
 * Token refresh is handled automatically by the Supabase SDK.
 * We listen to onAuthStateChange and keep the store in sync.
 */

import { create } from 'zustand';

import { storageGetItem, storageRemoveItem, storageSetItem } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import {
  getPersistedSession,
  signInWithMakaut,
  signOut as authSignOut,
} from '@/services/auth.service';
import type { MakautCredentials, UserProfile } from '@/types/database';

// ─── Constants ────────────────────────────────────────────────────────────────

const PROFILE_CACHE_KEY = 'campushub:profile_v2';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  /** The authenticated user profile, or null if signed out. */
  profile: UserProfile | null;
  /** True while an auth operation is in flight. */
  isLoading: boolean;
  /** True once the initial hydration pass has completed. */
  isHydrated: boolean;
  /** Last auth error message, or null. */
  error: string | null;

  /** Called once at app boot to restore session. */
  hydrate: () => Promise<void>;
  /** Sign in with MAKAUT credentials. Throws on failure. */
  signIn: (credentials: MakautCredentials) => Promise<void>;
  /** Clear the session and cached profile. */
  signOut: () => Promise<void>;
  /** Dismiss the current error. */
  clearError: () => void;
  /** Silently update profile (e.g. after background refresh). */
  _setProfile: (profile: UserProfile | null) => void;
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

async function cacheProfile(profile: UserProfile | null): Promise<void> {
  try {
    if (profile) {
      await storageSetItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    } else {
      await storageRemoveItem(PROFILE_CACHE_KEY);
    }
  } catch (e) {
    console.warn('[auth.store] Failed to cache profile:', e);
  }
}

async function loadCachedProfile(): Promise<UserProfile | null> {
  try {
    const raw = await storageGetItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  isLoading: false,
  isHydrated: false,
  error: null,

  // ── Hydrate ──────────────────────────────────────────────────────────────
  hydrate: async () => {
    // Don't re-hydrate if already done
    if (get().isHydrated) return;

    try {
      // Try Supabase session first (most authoritative), then cached snapshot
      const sessionProfile = await getPersistedSession();
      const profile = sessionProfile ?? (await loadCachedProfile());

      set({ profile, isHydrated: true, error: null });

      // Keep cache fresh if we got a live session
      if (sessionProfile) await cacheProfile(sessionProfile);
    } catch (e) {
      console.warn('[auth.store] Hydrate error:', e);
      set({ profile: null, isHydrated: true, error: null });
    }
  },

  // ── Sign in ──────────────────────────────────────────────────────────────
  signIn: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { profile } = await signInWithMakaut(credentials);
      await cacheProfile(profile);
      set({ profile, isLoading: false, error: null });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Sign in failed. Please try again.';
      set({ error: message, isLoading: false });
      throw e; // Re-throw so the UI can react if needed
    }
  },

  // ── Sign out ─────────────────────────────────────────────────────────────
  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await authSignOut();
      await cacheProfile(null);
      set({ profile: null, isLoading: false, error: null });
    } catch (e) {
      // Sign-out should still clear local state even if the network call fails
      await cacheProfile(null);
      const message = e instanceof Error ? e.message : 'Sign out failed.';
      set({ profile: null, isLoading: false, error: message });
    }
  },

  clearError: () => set({ error: null }),
  _setProfile: (profile) => set({ profile }),
}));

// ─── Supabase auth-state listener ─────────────────────────────────────────────
// Keeps the store in sync when Supabase refreshes tokens or invalidates sessions
// externally (e.g. password change from another device).

if (supabase) {
  supabase.auth.onAuthStateChange((event, session) => {
    const store = useAuthStore.getState();

    if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      if (!session && store.profile) {
        // Session expired / revoked
        cacheProfile(null).catch(() => {});
        store._setProfile(null);
      }
    }
    // TOKEN_REFRESHED: tokens are auto-updated by the SDK in AsyncStorage;
    // we don't need to do anything extra here.
  });
}

// ─── Convenience selector hooks ───────────────────────────────────────────────

export const useProfile = () => useAuthStore((s) => s.profile);
export const useIsAuthenticated = () => useAuthStore((s) => Boolean(s.profile));
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);
export const useAuthError = () => useAuthStore((s) => s.error);
export const useIsHydrated = () => useAuthStore((s) => s.isHydrated);
