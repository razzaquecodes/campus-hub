import '@/global.css';
import 'react-native-reanimated';

import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// MUST be evaluated at root scope to ensure WebBrowser correctly intercepts deep links
// and signals the waiting promise to close the Safari/Chrome custom tab.
WebBrowser.maybeCompleteAuthSession();

import { SplashScreen } from '@/components/animations/splash/SplashScreen';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/context/ThemeContext';
import { AppProviders } from '@/providers/app-providers';
import { useAuthStore } from '@/store/auth.store';

function useAuthGuard() {
  const { profile, isHydrated } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isRoot = segments.length === 0;

    console.info(`[router-decision] Auth guard running - Hydrated: ${isHydrated}, Profile: ${!!profile}, AuthGroup: ${inAuthGroup}, Root: ${isRoot}`);

    if (!profile) {
      if (!inAuthGroup) {
        console.info('[router-decision] Navigating to login');
        router.replace('/(auth)/login');
      }
    } else {
      if (inAuthGroup || isRoot) {
        console.info('[router-decision] Navigating to dashboard (tabs)');
        router.replace('/(tabs)');
      }
    }
  }, [profile, isHydrated, segments]);
}

function AppShell() {
  const { theme, isDark } = useTheme();
  const [animationDone, setAnimationDone] = useState(false);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  useAuthGuard();

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
            gestureEnabled: false // Fixes iOS bug where you can accidentally swipe back to login
          }} 
        />
        {/* Handles OAuth deep-link callbacks from campushub:// and exp:// */}
        <Stack.Screen
          name="oauth-callback"
          options={{ animation: 'none', headerShown: false }}
        />
        {/* Notification Center */}
        <Stack.Screen
          name="notifications"
          options={{ animation: 'slide_from_right', headerShown: false }}
        />
        <Stack.Screen name="about" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="attendance" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
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
