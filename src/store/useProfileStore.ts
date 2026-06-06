import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StudentProfile } from '@/types/profile';

interface ProfileState {
  profile: StudentProfile | null;
  isLoading: boolean;
  setProfile: (profile: StudentProfile) => void;
  clearProfile: () => void;
  updateProfile: (updates: Partial<StudentProfile>) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      isLoading: false,
      setProfile: (profile) => set({ profile }),
      clearProfile: () => set({ profile: null }),
      updateProfile: (updates) => set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : null
      })),
    }),
    {
      name: 'campus-hub-master-profile',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
