/**
 * oauth-callback.tsx
 *
 * This route receives the redirect from Supabase Google OAuth.
 * CRITICAL: We must call WebBrowser.maybeCompleteAuthSession() here so that
 * the in-app browser closes and passes the URL back to auth.service.ts.
 */
import * as WebBrowser from 'expo-web-browser';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View, Platform } from 'react-native';

// ─── CRITICAL ──────────────────────────────────────────────────────────────────
// This must be called at module scope. When the deep link opens this file,
// this function tells the WebBrowser (which is hovering over the app) to
// close itself and return the URL to the caller (auth.service.ts).
WebBrowser.maybeCompleteAuthSession();

export default function OAuthCallbackScreen() {
  const params = useLocalSearchParams();

  useEffect(() => {
    console.info('[oauth-callback] Reached callback route.', params);
    
    // In bare workflow on Android, maybeCompleteAuthSession() might not automatically
    // close the window if it opened a separate activity. We give it a tiny
    // buffer to process, then fallback to replacing the route.
    const timer = setTimeout(() => {
      if (Platform.OS === 'web') {
        // On web, maybeCompleteAuthSession handles everything via postMessage.
        return;
      }
      
      console.info('[oauth-callback] Fallback redirect triggered.');
      // Safely fallback to the login screen just so we don't get stuck on a blank screen.
      // The auth service is already processing the tokens in the background!
      router.replace('/(auth)/login');
    }, 1500);

    return () => clearTimeout(timer);
  }, [params]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#60A5FA" />
    </View>
  );
}
