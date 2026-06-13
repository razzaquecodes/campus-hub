import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { fetchMakautFeed, type MakautFeedItem } from '@/api/makaut-feed.api';

interface MakautFeedState {
  items: MakautFeedItem[];
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  fetchFeed: (force?: boolean) => Promise<void>;
  markAsRead: (id: string) => void;
  // A simple way to keep track of items the user has seen
  readItems: Record<string, boolean>;
}

export const useMakautFeedStore = create<MakautFeedState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,
      lastFetchedAt: null,
      readItems: {},

      fetchFeed: async (force = false) => {
        const { lastFetchedAt, isLoading } = get();
        
        if (isLoading) return;

        // Prevent spamming the API: only fetch if forced, or if it's been more than 5 minutes
        const now = Date.now();
        if (!force && lastFetchedAt && now - lastFetchedAt < 5 * 60 * 1000) {
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const newItems = await fetchMakautFeed(30); // Fetch latest 30 items
          set({
            items: newItems,
            isLoading: false,
            lastFetchedAt: now,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch feed';
          set({ error: message, isLoading: false });
        }
      },

      markAsRead: (id: string) => {
        set((state) => ({
          readItems: { ...state.readItems, [id]: true },
        }));
      },
    }),
    {
      name: 'makaut-feed-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        lastFetchedAt: state.lastFetchedAt,
        readItems: state.readItems,
      }), // Persist items for offline viewing
    }
  )
);
