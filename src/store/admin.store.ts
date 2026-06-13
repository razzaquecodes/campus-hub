import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdminState {
  isAdmin: boolean;
  adminEmail: string | null;

  setAdmin: (email: string) => void;
  clearAdmin: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      isAdmin: false,
      adminEmail: null,

      setAdmin: (email: string) => {
        set({ isAdmin: true, adminEmail: email });
      },

      clearAdmin: () => {
        set({ isAdmin: false, adminEmail: null });
      },
    }),
    {
      name: 'admin-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
