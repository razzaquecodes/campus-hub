/**
 * oauth-callback.tsx
 *
 * This route receives the redirect from Supabase Google OAuth.
 * CRITICAL: We must call WebBrowser.maybeCompleteAuthSession() here so that
 * the in-app browser closes and passes the URL back to auth.service.ts.
 * 
 * After the auth service completes the token exchange, this page serves as
 * a visual confirmation that the callback was received. It then navigates
 * back to the faculty login screen to complete the flow.
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
    
    // On web, maybeCompleteAuthSession handles everything via postMessage.
    // On native, WebBrowser.openAuthSessionAsync will detect the closure
    // and return the URL to auth.service.ts, which will then exchange the code
    // and navigate to the dashboard. We should simply wait here and show the loader.
  }, [params]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#60A5FA" />
    </View>
  );
}
