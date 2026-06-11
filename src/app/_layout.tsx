import '@/global.css';
import 'react-native-reanimated';

import {
    DarkTheme as NavigationDarkTheme,
    DefaultTheme as NavigationLightTheme,
    ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SplashScreen } from '@/components/animations/splash/SplashScreen';
import { UpdateModal } from '@/components/modals/UpdateModal';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/context/ThemeContext';
import { AppProviders } from '@/providers/app-providers';
import { registerBackgroundSync } from '@/services/background-sync.service';
import { UpdateInfo, updaterService } from '@/services/updater.service';
import { useAdminStore } from '@/store/admin.store';
import { useAuthStore } from '@/store/auth.store';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

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
    const isOauthCallback = segments[0] === 'oauth-callback';

    console.info('[router-decision] Auth guard running', {
      isHydrated,
      isAuthenticated,
      hasProfile: Boolean(profile),
      isAdmin,
      inAuthGroup,
      isRoot,
      isOauthCallback,
      segments,
    });

    const inFacultyGroup = segments[0] === 'faculty';

    if (!isAuthenticated) {
      if (!inAuthGroup && !isOauthCallback) {
        console.info('[router-decision] Navigating to login');
        router.replace('/(auth)/login');
      }
    } else if (isAdmin) {
      if (inAuthGroup || isRoot) {
        console.info('[router-decision] Navigating to faculty portal');
        router.replace('/faculty');
      }
    } else {
      if (inFacultyGroup) {
        console.info('[router-decision] Blocking student from faculty routes');
        router.replace('/(tabs)');
      } else if (inAuthGroup || isRoot) {
        console.info('[router-decision] Navigating to dashboard (tabs)');
        router.replace('/(tabs)');
      }
    }
  }, [profile, isAdmin, isHydrated, segments, isAuthenticated]);
}

function NotificationBootstrap() {
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (Platform.OS !== 'web' && response?.notification?.request?.content?.data?.url) {
      router.push(response.notification.request.content.data.url as any);
    }
  }, [response]);

  return null;
}

function AppShell() {
  const { theme, isDark } = useTheme();
  const [animationDone, setAnimationDone] = useState(false);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  useAuthGuard();

  console.info('[AppShell] Rendering', { animationDone, isHydrated });

  // Updater State
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    // Check for updates on startup
    const checkUpdates = async () => {
      try {
        const info = await updaterService.checkForUpdates();
        if (info.isAvailable) {
          setUpdateInfo(info);
          setUpdateModalVisible(true);
        }
      } catch (e) {
        console.warn('[AppShell] checkForUpdates failed (non-fatal)', e);
      }
    };
    // Optional delay so it doesn't block UI right away
    const timeout = setTimeout(checkUpdates, 1500);
    return () => clearTimeout(timeout);
  }, []);
  
  useEffect(() => {
    if (isHydrated) {
      console.info('[AppShell] Hydrated — registering background sync');
      registerBackgroundSync();
    }
  }, [isHydrated]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // With baseUrl: '/app', use /app/sw.js
      navigator.serviceWorker.register('/app/sw.js').then((registration) => {
        console.info('[ServiceWorker] Registered with scope:', registration.scope);
      }).catch((err) => {
        console.error('[ServiceWorker] Registration failed:', err);
      });
    }
  }, []);

  // Safety fallback: force animation complete after 3 seconds
  // This prevents infinite loading if the animation callback fails
  useEffect(() => {
    console.info('[AppShell] Setting animation safety fallback');
    const timeout = setTimeout(() => {
      console.info('[AppShell] Animation timeout — forcing complete');
      setAnimationDone(true);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  const ready = animationDone && isHydrated;
  
  console.info('[AppShell] ready state:', { ready, animationDone, isHydrated });

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
      {Platform.OS !== 'web' && <NotificationBootstrap />}
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

      {/* Global Update Modal */}
      <UpdateModal
        visible={updateModalVisible}
        updateInfo={updateInfo}
        onClose={() => setUpdateModalVisible(false)}
      />
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
