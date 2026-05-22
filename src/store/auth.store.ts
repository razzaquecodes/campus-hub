import { create } from 'zustand';

import { MOCK_PROFILE } from '@/constants/mock-data';
import { storageGetItem, storageRemoveItem, storageSetItem } from '@/lib/storage';
import { getPersistedSession, signInWithMakaut, signOut as authSignOut } from '@/services/auth.service';
import type { MakautCredentials, UserProfile } from '@/types/database';

const PROFILE_KEY = 'campushub_profile';

interface AuthState {
  profile: UserProfile | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  signIn: (credentials: MakautCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

async function persistProfile(profile: UserProfile | null): Promise<void> {
  try {
    if (profile) {
      await storageSetItem(PROFILE_KEY, JSON.stringify(profile));
    } else {
      await storageRemoveItem(PROFILE_KEY);
    }
  } catch (e) {
    console.warn('[auth] Failed to persist profile:', e);
  }
}

async function loadCachedProfile(): Promise<UserProfile | null> {
  try {
    const raw = await storageGetItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  isLoading: false,
  isHydrated: false,
  error: null,

  hydrate: async () => {
    try {
      const sessionProfile = await getPersistedSession();
      const cached = sessionProfile ?? (await loadCachedProfile());
      set({ profile: cached, isHydrated: true, error: null });
    } catch (e) {
      console.warn('[auth] Hydrate failed:', e);
      set({ profile: null, isHydrated: true, error: null });
    }
  },

  signIn: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { profile } = await signInWithMakaut(credentials);
      await persistProfile(profile);
      set({ profile, isLoading: false, error: null });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign in failed';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await authSignOut();
      await persistProfile(null);
      set({ profile: null, isLoading: false, error: null });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign out failed';
      set({ profile: null, isLoading: false, error: message });
    }
  },

  clearError: () => set({ error: null }),
}));

export function useDemoSession() {
  void persistProfile(MOCK_PROFILE);
  return useAuthStore.setState({ profile: MOCK_PROFILE, isHydrated: true, error: null });
}
