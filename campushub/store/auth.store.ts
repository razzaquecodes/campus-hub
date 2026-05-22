// store/auth.store.ts
import { create } from 'zustand';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  enrollmentNo: string;
  branch: string;
  semester: number;
  avatarInitials: string;
}

interface AuthState {
  profile: UserProfile | null;
  isHydrated: boolean;
  login: (profile: UserProfile) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  isHydrated: false,

  hydrate: () => {
    // Simulate async hydration (e.g. from AsyncStorage)
    setTimeout(() => {
      set({ isHydrated: true });
    }, 100);
  },

  login: (profile) => {
    set({ profile, isHydrated: true });
  },

  logout: () => {
    set({ profile: null });
  },
}));
