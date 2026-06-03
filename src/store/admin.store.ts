import { create } from 'zustand';

interface AdminState {
  isAdmin: boolean;
  adminEmail: string | null;

  setAdmin: (email: string) => void;
  clearAdmin: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  isAdmin: false,
  adminEmail: null,

  setAdmin: (email: string) => {
    set({ isAdmin: true, adminEmail: email });
  },

  clearAdmin: () => {
    set({ isAdmin: false, adminEmail: null });
  },
}));
