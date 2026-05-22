import '@/global.css';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import {
    DarkTheme as NavigationDarkTheme,
    ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Theme } from '@/constants/theme';
import { ThemeProvider as AppThemeProvider } from '@/context/ThemeContext';
import { AppProviders } from '@/providers/app-providers';

const CampusTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: Theme.colors.primary,
    background: Theme.colors.background,
    card: Theme.colors.surface,
    text: Theme.colors.textPrimary,
    border: Theme.colors.border,
  },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Theme.colors.void }}>
      <AppProviders>
        <AppThemeProvider>
          <NavigationThemeProvider value={CampusTheme}>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade',
                contentStyle: { backgroundColor: Theme.colors.void },
              }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="about" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="attendance" options={{ animation: 'slide_from_bottom' }} />
            </Stack>
          </NavigationThemeProvider>
        </AppThemeProvider>
      </AppProviders>
    </GestureHandlerRootView>
  );
}
