/**
 * oauth-callback.tsx
 *
 * This route is kept to avoid 404s from any residual deep links but is no
 * longer part of the authentication flow. The app now uses MAKAUT student
 * verification instead of Google OAuth.
 *
 * Any traffic arriving here is immediately redirected to the login screen.
 */
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function OAuthCallbackScreen() {
  useEffect(() => {
    // Redirect immediately — OAuth is no longer used
    router.replace('/(auth)/login');
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#60A5FA" />
    </View>
  );
}
