/**
 * auth.store.ts
 *
 * Legacy auth store — now acts as a thin compatibility bridge.
 *
 * The primary authentication source is now useStudentStore (MAKAUT verification).
 * This store maps StudentModel → UserProfile so that all existing dashboard
 * screens, profile screen, and queries continue working without modification.
 *
 * What changed:
 *   - Removed: signInWithGoogle, signInAsGuest, hydrateAuthenticatedSession
 *   - Removed: Supabase Auth session dependency
 *   - Added:   mapStudentToUserProfile() to translate student data
 *   - Kept:    profile, makautProfile, isLoading, isHydrated, error
 *   - Kept:    setProfile, setMakautProfile, setIsHydrated, signOut, clearError
 *
 * isHydrated and profile are now derived from useStudentStore and synced
 * by AuthHydrator in app-providers.tsx.
 */

import { create } from 'zustand';

import { queryClient } from '@/lib/query-client';
import { clearSession } from '@/services/makaut-auth.service';
import type { StudentProfile, UserProfile } from '@/types/database';
import type { StudentModel } from '@/types/student';

const storeLog = function (message: string, details?: Record<string, unknown>) {
  const ts = new Date().toISOString().slice(11, 23);
  const payload = details ? ` ${JSON.stringify(details)}` : '';
  console.info(`[auth-store][${ts}] ${message}${payload}`);
};

// ─── Mapper: StudentModel → UserProfile ──────────────────────────────────────
/**
 * Translate a verified MAKAUT StudentModel into the UserProfile shape
 * consumed by existing dashboard screens and queries.
 */
export function mapStudentToUserProfile(student: StudentModel): UserProfile {
  return {
    id: `makaut_${student.rollNumber}`,
    roll_number: student.rollNumber,
    email: student.email,
    full_name: student.fullName,
    role: 'student',
    college: student.instituteName,
    branch: student.courseName ?? null,
    phone: student.mobile ?? null,
    avatar_url: null,
    is_verified: student.verified,
    // Optional fields — not available from initial MAKAUT verification but added via background sync
    branch_id: null,
    semester_id: null,
    section_id: null,
    semester: student.semester ?? null,
    section: null,
    year: student.semester ? String(Math.ceil(parseInt(student.semester, 10) / 2)) : null,
    batch: null,
    advisor: null,
    hostel_block: null,
    hostel_room: null,
  };
}

// ─── State shape ──────────────────────────────────────────────────────────────
interface AuthState {
  profile: UserProfile | null;
  makautProfile: StudentProfile | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;

  setProfile: (profile: UserProfile | null) => void;
  setMakautProfile: (profile: StudentProfile | null) => void;
  setIsHydrated: (isHydrated: boolean) => void;
  signOut: () => Promise<void>;
  clearError: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  makautProfile: null,
  isLoading: false,
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

  signOut: async () => {
    storeLog('signOut: starting');
    set({ isLoading: true, error: null });
    try {
      await clearSession();
      await queryClient.clear();
      set({ profile: null, makautProfile: null, isLoading: false, error: null });
      storeLog('signOut: complete');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign out failed';
      storeLog('signOut: failed', { error: message });
      // Force clear even on error
      set({ profile: null, makautProfile: null, isLoading: false, error: message });
    }
  },

  clearError: () => set({ error: null }),
}));
