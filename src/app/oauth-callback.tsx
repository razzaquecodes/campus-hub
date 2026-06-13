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
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, Platform, Alert, Text } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useFacultyStore } from '@/store/faculty.store';
import { useAdminStore } from '@/store/admin.store';

WebBrowser.maybeCompleteAuthSession();

export default function OAuthCallbackScreen() {
  const params = useLocalSearchParams();
  const [error, setError] = useState<string | null>(null);
  const exchangedRef = useRef(false);

  useEffect(() => {
    console.info('[oauth-callback] Reached callback route.', params);
    
    // On web, maybeCompleteAuthSession handles everything via postMessage if it was a popup.
    // If it was a full-page redirect (like a PWA), window.opener is null, and maybeCompleteAuthSession does nothing.
    if (Platform.OS === 'web') {
      const handleFullPageRedirect = async () => {
        try {
          const hash = window.location.hash;
          const search = window.location.search;
          const searchParams = new URLSearchParams(search);
          const code = searchParams.get('code');
          const errParam = searchParams.get('error') || searchParams.get('error_description');
          
          if (errParam) {
            throw new Error(`OAuth Error: ${errParam}`);
          }
          
          if (!hash.includes('access_token=') && !code) {
            // No tokens in URL, likely a cancelled login or missing params
            router.replace('/(auth)/faculty-login');
            return;
          }

          // EXPLICITLY EXCHANGE CODE FOR SESSION
          // This fixes the infinite spinner when detectSessionInUrl doesn't trigger automatically
          if (code && !exchangedRef.current) {
            exchangedRef.current = true;
            console.info('[oauth-callback] Exchanging code for session explicitly...');
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) throw exchangeError;
          }

          // Now fetch the session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) throw sessionError;
          if (!session) {
            // Session hasn't been set yet. Wait for the auth state change.
            return; // onAuthStateChange (below) will catch it
          }

          // Session exists! Check if faculty
          const email = session.user.email?.trim().toLowerCase();
          if (!email) throw new Error('No email found in session');

          const { data: facultyRow, error: facultyError } = await supabase
            .from('faculty')
            .select('id, full_name, department, designation, email, phone, created_at')
            .eq('email', email)
            .limit(1)
            .single();

          if (facultyError || !facultyRow) {
            throw new Error('You are not authorized to access the faculty portal.');
          }

          useFacultyStore.getState().setProfile({
            id: facultyRow.id,
            name: facultyRow.full_name,
            department: facultyRow.department,
            designation: facultyRow.designation,
            employeeId: facultyRow.id,
            email: facultyRow.email || email,
            phone: facultyRow.phone || '',
            joiningDate: facultyRow.created_at,
          });

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
    } else {
      // For native, if we end up stuck here without the browser closing, auto-redirect back
      const timer = setTimeout(() => {
        router.replace('/(auth)/faculty-login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [params]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#60A5FA" />
      {error && <Text style={{ color: '#EF4444', marginTop: 16 }}>{error}</Text>}
    </View>
  );
}
