// app/index.tsx
// Entry point — redirects based on auth state
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { profile, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#6366F1" size="large" />
      </View>
    );
  }

  if (!profile) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
}
