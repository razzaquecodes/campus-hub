/**
 * student.store.ts
 *
 * Zustand store for MAKAUT student authentication state.
 *
 * State:
 *   student          — verified StudentModel or null
 *   isAuthenticated  — true when a verified student session is active
 *   isLoading        — true during login/logout/session restore
 *   isHydrated       — true after initial session restore attempt completes
 *   error            — last error message or null
 *
 * Actions:
 *   login(rollNumber, password)  — verify + persist + upsert
 *   logout()                     — clear session + reset state
 *   restoreSession()             — rehydrate from storage on app launch
 *   updateProfile(partial)       — update fields in-memory (for future profile edits)
 *   clearError()                 — reset error state
 */

import { create } from 'zustand';

import {
  clearSession,
  persistSession,
  restoreSession as restoreFromStorage,
  upsertStudentProfile,
  verifyStudent,
} from '@/services/makaut-auth.service';
import { registerForPushNotifications, savePushToken } from '@/services/notifications.service';
import type { StudentModel } from '@/types/student';

// ─── Logging ──────────────────────────────────────────────────────────────────
function log(message: string, details?: Record<string, unknown>): void {
  const ts = new Date().toISOString().slice(11, 23);
  const payload = details ? ` ${JSON.stringify(details)}` : '';
  console.info(`[student-store][${ts}] ${message}${payload}`);
}

// ─── State shape ──────────────────────────────────────────────────────────────
interface StudentState {
  student: StudentModel | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;

  login: (rollNumber: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updateProfile: (partial: Partial<StudentModel>) => void;
  clearError: () => void;
  
  readNotices: string[];
  markNoticeAsRead: (id: string) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useStudentStore = create<StudentState>((set, get) => ({
  student: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,
  error: null,
  readNotices: [],

  markNoticeAsRead: (id) => set((state) => {
    if (!state.readNotices.includes(id)) {
      return { readNotices: [...state.readNotices, id] };
    }
    return state;
  }),

  // ── login ──────────────────────────────────────────────────────────────────
  login: async (rollNumber: string, password: string) => {
    log('login: starting', { rollNumber });
    set({ isLoading: true, error: null });

    try {
      // 1. Verify student credentials against backend
      const student = await verifyStudent(rollNumber, password);
      log('login: verification succeeded', { rollNumber: student.rollNumber });

      // 2. Persist session to device storage (no password stored)
      await persistSession(student);
      log('login: session persisted');

      // 3. Update Supabase (best-effort, non-blocking)
      upsertStudentProfile(student).catch((e) => {
        log('login: Supabase upsert failed (non-fatal)', {
          error: e instanceof Error ? e.message : String(e),
        });
      });

      // 4. Update store
      set({
        student,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      log('login: store updated — student is authenticated');
      
      // 5. Register push notifications
      registerForPushNotifications().then((token) => {
        if (token) savePushToken(student.rollNumber, token);
      }).catch((e) => {
        log('login: failed to register push notifications (non-fatal)', {
          error: e instanceof Error ? e.message : String(e),
        });
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Verification failed. Please try again.';
      log('login: failed', { error: message });
      set({ student: null, isAuthenticated: false, isLoading: false, error: message });
      throw e; // re-throw so the UI can handle it
    }
  },

  // ── logout ─────────────────────────────────────────────────────────────────
  logout: async () => {
    log('logout: clearing session');
    set({ isLoading: true, error: null });

    try {
      await clearSession();
      set({
        student: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      log('logout: complete');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Logout failed';
      log('logout: failed', { error: message });
      // Force clear state even on error
      set({ student: null, isAuthenticated: false, isLoading: false, error: message });
    }
  },

  // ── restoreSession ─────────────────────────────────────────────────────────
  restoreSession: async () => {
    // Guard against multiple simultaneous calls
    if (get().isHydrated) {
      log('restoreSession: already hydrated — skipping');
      return;
    }

    log('restoreSession: checking for persisted session');
    set({ isLoading: true });

    try {
      const student = await restoreFromStorage();

      if (student) {
        log('restoreSession: session restored', { rollNumber: student.rollNumber });
        set({
          student,
          isAuthenticated: true,
          isLoading: false,
          isHydrated: true,
          error: null,
        });
        
        // Ensure device is registered for notifications
        registerForPushNotifications().then((token) => {
          if (token) savePushToken(student.rollNumber, token);
        }).catch((e) => {
          log('restoreSession: failed to register push notifications (non-fatal)', {
            error: e instanceof Error ? e.message : String(e),
          });
        });
      } else {
        log('restoreSession: no session found');
        set({
          student: null,
          isAuthenticated: false,
          isLoading: false,
          isHydrated: true,
          error: null,
        });
      }
    } catch (e) {
      log('restoreSession: error during restore (non-fatal)', {
        error: e instanceof Error ? e.message : String(e),
      });
      // Always mark hydrated so the app doesn't hang on splash screen
      set({
        student: null,
        isAuthenticated: false,
        isLoading: false,
        isHydrated: true,
        error: null,
      });
    }
  },

  // ── updateProfile ──────────────────────────────────────────────────────────
  updateProfile: (partial: Partial<StudentModel>) => {
    const { student } = get();
    if (!student) {
      log('updateProfile: no student in store — ignoring');
      return;
    }
    const updated = { ...student, ...partial };
    set({ student: updated });
    // Best-effort persist the updated data
    persistSession(updated).catch((e) => {
      log('updateProfile: failed to persist update', {
        error: e instanceof Error ? e.message : String(e),
      });
    });
    log('updateProfile: profile updated', { fields: Object.keys(partial) });
  },

  // ── clearError ─────────────────────────────────────────────────────────────
  clearError: () => set({ error: null }),
}));
