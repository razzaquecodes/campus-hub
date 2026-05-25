import { create } from 'zustand';

import { signInWithGoogle as authSignInWithGoogle, signOut as authSignOut } from '@/services/auth.service';
import type { StudentProfile, UserProfile } from '@/types/database';

const storeLog = function (message: string, details?: Record<string, unknown>) {
  const ts = new Date().toISOString().slice(11, 23);
  const payload = details ? ` ${JSON.stringify(details)}` : '';
  console.info(`[auth-store][${ts}] ${message}${payload}`);
}

interface AuthState {
  profile: UserProfile | null;
  makautProfile: StudentProfile | null;
  isLoading: boolean;
  isSigningIn: boolean;
  isHydrated: boolean;
  error: string | null;
  setProfile: (profile: UserProfile | null) => void;
  setMakautProfile: (profile: StudentProfile | null) => void;
  setIsHydrated: (isHydrated: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => void;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  makautProfile: null,
  isLoading: false,
  isSigningIn: false,
  isHydrated: false,
  error: null,

  setProfile: (profile: UserProfile | null) => {
    storeLog('setProfile called', {
      hasProfile: Boolean(profile),
      userId: profile?.id ?? null,
    });
    set({ profile });
  },

  setMakautProfile: (makautProfile: StudentProfile | null) => {
    storeLog('setMakautProfile called', {
      hasMakautProfile: Boolean(makautProfile),
    });
    set({ makautProfile });
  },

  setIsHydrated: (isHydrated: boolean) => {
    storeLog('setIsHydrated', { isHydrated });
    set({ isHydrated });
  },

  signInWithGoogle: async () => {
    storeLog('signInWithGoogle: starting');
    set({ isLoading: true, isSigningIn: true, error: null });

    try {
      // signInWithGoogle (auth.service) handles the OAuth flow and session exchange.
      // It returns void. The profile is set reactively by AuthHydrator.onAuthStateChange(SIGNED_IN).
      await authSignInWithGoogle();

      storeLog('signInWithGoogle: OAuth flow completed, session created');

      // The profile will be set by AuthHydrator.onAuthStateChange(SIGNED_IN) which
      // fires automatically after exchangeCodeForSession() / setSession() succeeds.
      // We don't need to poll for it; the subscription handles it reactively.
      
      set({ isLoading: false, isSigningIn: false, error: null });
      storeLog('signInWithGoogle: complete', {
        hasProfile: Boolean(get().profile),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Google Sign in failed';
      storeLog('signInWithGoogle: failed', { error: message });
      set({ error: message, isLoading: false, isSigningIn: false });
      throw e;
    }
  },

  signInAsGuest: () => {
    storeLog('signInAsGuest');
    const guestProfile: UserProfile = {
      id: 'guest-id',
      roll_number: 'GUEST-2026',
      email: 'guest@bbit.edu.in',
      full_name: 'Guest Scholar',
      role: 'student',
      branch: 'Computer Science & Engineering',
      semester: '4',
      section: 'C',
      year: '2nd Year',
      batch: '2024-2028',
      advisor: 'Prof. Arjun Chatterjee',
      phone: '+91 98765 43210',
      hostel_block: 'A',
      hostel_room: '101',
      college: 'Budge Budge Institute of Technology',
      avatar_url: null,
      is_verified: false,
    };
    set({ profile: guestProfile, makautProfile: null, isLoading: false, error: null });
  },

  signOut: async () => {
    storeLog('signOut: starting');
    set({ isLoading: true, error: null });
    try {
      await authSignOut();
      set({ profile: null, makautProfile: null, isLoading: false, error: null });
      storeLog('signOut: complete');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign out failed';
      storeLog('signOut: failed', { error: message });
      set({ profile: null, makautProfile: null, isLoading: false, error: message });
    }
  },

  clearError: () => set({ error: null }),
}));
