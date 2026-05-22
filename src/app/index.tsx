import { Redirect, type Href } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Theme } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';

export default function Index() {
  const { profile, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: Theme.colors.void, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  if (profile) {
    return <Redirect href={'/(tabs)' as Href} />;
  }

  return <Redirect href={'/(auth)/login' as Href} />;
}
