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
 * 
 * For Web: The callback URL contains the auth code in query parameters.
 * We extract it here and let the auth service handle the exchange.
 */
import * as WebBrowser from 'expo-web-browser';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

// ─── CRITICAL ──────────────────────────────────────────────────────────────────
// This must be called at module scope. When the deep link opens this file,
// this function tells the WebBrowser (which is hovering over the app) to
// close itself and return the URL to the caller (auth.service.ts).
WebBrowser.maybeCompleteAuthSession();

export default function OAuthCallbackScreen() {
  const params = useLocalSearchParams();
  const navigationHandled = useRef(false);

  useEffect(() => {
    // Prevent multiple navigations
    if (navigationHandled.current) return;
    
    console.info('[oauth-callback] Reached callback route.', params);
    
    // On web, maybeCompleteAuthSession handles everything via postMessage.
    // For native, we give it a buffer then fallback to redirecting.
    const timer = setTimeout(() => {
      if (navigationHandled.current) return;
      navigationHandled.current = true;
      
      console.info('[oauth-callback] Fallback redirect triggered.');
      // Navigate back to faculty login - the auth service has already processed
      // the session. This is just the visual redirect after the deep link was handled.
      router.replace('/(auth)/faculty-login');
    }, 1500);

    return () => clearTimeout(timer);
  }, [params]);

  // Handle error params from OAuth callback
  useEffect(() => {
    if (params.error) {
      console.error('[oauth-callback] OAuth error:', params.error, params.error_description);
      navigationHandled.current = true;
      router.replace({
        pathname: '/(auth)/faculty-login',
        params: { authError: params.error_description || params.error }
      });
    }
  }, [params.error, params.error_description]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#60A5FA" />
    </View>
  );
}
