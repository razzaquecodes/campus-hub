// context/ThemeContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import {
    useSharedValue,
    withTiming,
    type SharedValue
} from 'react-native-reanimated';

import { DarkTheme, LightTheme, type AppTheme } from '@/constants/theme';

const THEME_KEY = '@campus_hub_theme';

type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  theme: AppTheme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  // Animated progress 0=dark 1=light (for cross-fade transitions)
  themeProgress: SharedValue<number>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const themeProgress = useSharedValue(0); // 0=dark, 1=light

  // Resolve actual theme
  const resolvedDark =
    themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';
  const theme = resolvedDark ? DarkTheme : LightTheme;

  // Animate on change
  useEffect(() => {
    themeProgress.value = withTiming(resolvedDark ? 0 : 1, { duration: 350 });
  }, [resolvedDark, themeProgress]);

  // Hydrate from storage
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val === 'dark' || val === 'light' || val === 'system') {
        setThemeModeState(val);
      }
    });
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_KEY, mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(resolvedDark ? 'light' : 'dark');
  }, [resolvedDark, setThemeMode]);

  return (
    <ThemeContext.Provider
      value={{ theme, themeMode, isDark: resolvedDark, setThemeMode, toggleTheme, themeProgress }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
