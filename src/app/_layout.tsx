import '@/global.css';
import 'react-native-reanimated';

import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SplashScreen } from '@/components/animations/splash/SplashScreen';
import { useAuthStore } from '@/store/auth.store';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/context/ThemeContext';
import { AppProviders } from '@/providers/app-providers';

function AppShell() {
  const { theme, isDark } = useTheme();
  const [animationDone, setAnimationDone] = useState(false);
  const isHydrated = useAuthStore((s) => s.isHydrated);

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
