import '@/global.css';
import 'react-native-reanimated';

import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';

import { SplashScreen } from '@/components/animations/splash/SplashScreen';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/context/ThemeContext';
import { AppProviders } from '@/providers/app-providers';
import { useAuthStore } from '@/store/auth.store';
import { useAdminStore } from '@/store/admin.store';
import { registerBackgroundSync } from '@/services/background-sync.service';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * useAuthGuard — Reactive navigation guard.
 *
 * Reads authentication state from useStudentStore (primary source of truth)
 * and mirrors it into useAuthStore.profile for backward-compatibility with
 * existing dashboard screens that read from useAuthStore.
 *
 * Navigation rules:
 *   - No session, not in auth group → navigate to /(auth)/login
 *   - Has session, in auth group    → navigate to /(tabs)
 *   - Has session, at root index    → navigate to /(tabs)
 */
function useAuthGuard() {
  const { profile, isHydrated } = useAuthStore();
  const isAdmin = useAdminStore((s) => s.isAdmin);
  const segments = useSegments();

  const isAuthenticated = Boolean(profile) || isAdmin;

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isRoot = segments[0] == null;

    console.info('[router-decision] Auth guard running', {
      isHydrated,
      isAuthenticated,
      hasProfile: Boolean(profile),
      isAdmin,
      inAuthGroup,
      isRoot,
      segments,
    });

    if (!isAuthenticated) {
      if (!inAuthGroup) {
        console.info('[router-decision] Navigating to login');
        router.replace('/(auth)/login');
      }
    } else {
      if (isAdmin) {
        if (inAuthGroup || isRoot) {
          console.info('[router-decision] Navigating to faculty portal');
          router.replace('/faculty');
        }
      } else {
        if (inAuthGroup || isRoot) {
          console.info('[router-decision] Navigating to dashboard (tabs)');
          router.replace('/(tabs)');
        }
      }
    }
  }, [profile, isAdmin, isHydrated, segments, isAuthenticated]);
}

function AppShell() {
  const { theme, isDark } = useTheme();
  const [animationDone, setAnimationDone] = useState(false);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  useAuthGuard();
  
  useEffect(() => {
    if (isHydrated) {
      registerBackgroundSync();
    }
  }, [isHydrated]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.info('[ServiceWorker] Registered with scope:', registration.scope);
      }).catch((err) => {
        console.error('[ServiceWorker] Registration failed:', err);
      });
    }
  }, []);
  
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (isHydrated && lastNotificationResponse) {
      const data = lastNotificationResponse.notification.request.content.data;
      if (data && typeof data.url === 'string') {
        console.info('[notifications] Deep linking to:', data.url);
        router.push(data.url as any);
      }
    }
  }, [lastNotificationResponse, isHydrated]);

  const ready = animationDone && isHydrated;

  const navTheme = isDark
    ? {
        ...NavigationDarkTheme,
        colors: {
          ...NavigationDarkTheme.colors,
          primary: theme.colors.primary,
          background: theme.colors.void,
          card: theme.colors.surface,
          text: theme.colors.textPrimary,
          border: theme.colors.border,
          notification: theme.colors.danger,
        },
      }
    : {
        ...NavigationLightTheme,
        colors: {
          ...NavigationLightTheme.colors,
          primary: theme.colors.primary,
          background: theme.colors.void,
          card: theme.colors.surface,
          text: theme.colors.textPrimary,
          border: theme.colors.border,
          notification: theme.colors.danger,
        },
      };

  return (
    <NavigationThemeProvider value={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: Platform.OS === 'ios' ? 'slide_from_right' : 'fade',
          contentStyle: { backgroundColor: theme.colors.void },
        }}>
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="(tabs)"
          options={{
            animation: 'fade',
            gestureEnabled: false, // Prevents iOS swipe-back to login
          }}
        />
        {/* Notification Center */}
        <Stack.Screen
          name="notifications"
          options={{ animation: 'slide_from_right', headerShown: false }}
        />
        <Stack.Screen name="about" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen
          name="attendance"
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
        <Stack.Screen
          name="digital-id"
          options={{ animation: 'slide_from_bottom', presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="internal-marks"
          options={{ animation: 'slide_from_right', headerShown: false }}
        />
        <Stack.Screen
          name="results"
          options={{ animation: 'slide_from_right', headerShown: false }}
        />
      </Stack>
      {!ready && (
        <View style={StyleSheet.absoluteFill} pointerEvents="auto">
          <SplashScreen onAnimationComplete={() => setAnimationDone(true)} />
        </View>
      )}
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <AppThemeProvider>
          <AppShell />
        </AppThemeProvider>
      </AppProviders>
    </GestureHandlerRootView>
  );
}
