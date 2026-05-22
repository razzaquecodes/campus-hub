// navigation/auth-guard.tsx  (updated)
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/auth.store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { profile, isHydrated } = useAuthStore();
  const { theme } = useTheme();

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.void, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return <Redirect href="/(auth)/login" />;
  }

  return <>{children}</>;
}
