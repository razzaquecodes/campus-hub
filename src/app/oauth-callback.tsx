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
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Platform, Alert } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useAdminStore } from '@/store/admin.store';

WebBrowser.maybeCompleteAuthSession();

export default function OAuthCallbackScreen() {
  const params = useLocalSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.info('[oauth-callback] Reached callback route.', params);
    
    // On web, maybeCompleteAuthSession handles everything via postMessage if it was a popup.
    // If it was a full-page redirect (like a PWA), window.opener is null, and maybeCompleteAuthSession does nothing.
    if (Platform.OS === 'web') {
      const handleFullPageRedirect = async () => {
        try {
          const hash = window.location.hash;
          const search = window.location.search;
          
          if (!hash.includes('access_token=') && !search.includes('code=')) {
            // No tokens in URL, likely a cancelled login or missing params
            router.replace('/(auth)/faculty-login');
            return;
          }

          // Supabase JS auto-handles the URL tokens on web. We just need to wait for the session.
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) throw sessionError;
          if (!session) {
            // Session hasn't been set yet. Wait for the auth state change.
            return; // onAuthStateChange (below) will catch it
          }

          // Session exists! Check if faculty
          const email = session.user.email?.trim().toLowerCase();
          if (!email) throw new Error('No email found in session');

         const { data: adminRow, error: adminError } = await supabase
  .from('admins')
  .select('email')
  .eq('email', email)
  .single();

if (adminError || !adminRow) {
  throw new Error('You are not authorized to access the faculty portal.');
}
          useAdminStore.getState().setAdmin(email);
          router.replace('/faculty');
        } catch (err: any) {
          console.error('[oauth-callback] PWA login fallback failed:', err);
          router.replace({ pathname: '/(auth)/faculty-login', params: { authError: err.message } });
        }
      };

      handleFullPageRedirect();

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Try to handle it again now that session is set
          handleFullPageRedirect();
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [params]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#60A5FA" />
    </View>
  );
}
