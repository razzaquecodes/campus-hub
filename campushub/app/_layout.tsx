/**
 * app/_layout.tsx  — Root layout
 *
 * Responsibilities:
 *  1. Hydrate auth store (restore session) before any navigation decision
 *  2. Keep SplashScreen visible until hydration is done
 *  3. Redirect unauthenticated users to /login, authenticated to /(tabs)
 *  4. Provide QueryClient + global providers
 *
 * Routing rules (Expo Router redirect pattern):
 *  - Not hydrated yet   → show nothing (splash is still up)
 *  - No profile         → redirect to /login
 *  - Has profile        → redirect away from /login to /(tabs)
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';

import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth.store';

// Prevent auto-hide — we control it after hydration
SplashScreen.preventAutoHideAsync();

// ─── Auth gate ────────────────────────────────────────────────────────────────

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const profile = useAuthStore((s) => s.profile);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!profile && !inAuthGroup) {
      // Not signed in — send to login
      router.replace('/(auth)/login');
    } else if (profile && inAuthGroup) {
      // Already signed in — send to app
      router.replace('/(tabs)');
    }
  }, [isHydrated, profile, segments, router]);

  return null;
}

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  // Load fonts before revealing UI
  const [fontsLoaded, fontError] = useFonts({
    // Add your custom fonts here, e.g.:
    // 'Geist-Regular': require('@/assets/fonts/Geist-Regular.ttf'),
  });

  // Run hydration once on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Hide splash once both fonts and auth hydration are complete
  const onLayoutRootView = useCallback(async () => {
    if ((fontsLoaded || fontError) && isHydrated) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isHydrated]);

  if (!fontsLoaded && !fontError) return null;
  if (!isHydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <QueryClientProvider client={queryClient}>
        {/* AuthGate listens for auth state changes and redirects */}
        <AuthGate />

        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          {/* Auth screens — no tabs, no header */}
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          {/* Main app — tabs */}
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          {/* Modal screens (optional) */}
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
