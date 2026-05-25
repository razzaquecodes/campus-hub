import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CALLBACK_TIMEOUT_MS = 15000; // 15 seconds

function callbackLog(message: string, details?: Record<string, unknown>) {
  const ts = new Date().toISOString().slice(11, 23);
  const payload = details ? ` ${JSON.stringify(details)}` : '';
  console.info(`[oauth-callback][${ts}] ${message}${payload}`);
}

// ─── OAuth Callback Screen ────────────────────────────────────────────────────
//
// This screen handles two scenarios:
//
// 1. openAuthSessionAsync DID intercept the redirect (normal path).
//    → signInWithGoogle() already called exchangeCodeForSession().
//    → onAuthStateChange(SIGNED_IN) fired → AuthHydrator set the profile.
//    → The store's auth-guard immediately navigates away from this screen.
//    → This screen shows briefly but is never the primary handler.
//
// 2. The deep link bypassed openAuthSessionAsync and was routed through
//    Expo Router (e.g. app was backgrounded, standalone deep link opened
//    from outside the app).
//    → This screen extracts the code/tokens from the URL params and
//      completes the session exchange itself.
//
export default function OAuthCallbackScreen() {
  const params = useLocalSearchParams<{
    code?: string;
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  }>();

  // Guard against double-execution in StrictMode / fast-refresh
  const handled = useRef(false);
  const [status, setStatus] = useState<'processing' | 'error' | 'timeout'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    callbackLog('OAuthCallbackScreen mounted', {
      hasCode: Boolean(params.code),
      hasAccessToken: Boolean(params.access_token),
      hasRefreshToken: Boolean(params.refresh_token),
      hasError: Boolean(params.error),
    });

    // Set up a timeout to prevent infinite spinner
    const timeoutId = setTimeout(() => {
      callbackLog('Callback processing timed out');
      setStatus('timeout');
    }, CALLBACK_TIMEOUT_MS);

    const handleCallback = async () => {
      if (!supabase) {
        callbackLog('No Supabase client — redirecting to login');
        clearTimeout(timeoutId);
        router.replace('/(auth)/login');
        return;
      }

      // Error from OAuth provider
      if (params.error) {
        callbackLog('OAuth error received', {
          error: params.error,
          description: params.error_description,
        });
        clearTimeout(timeoutId);
        setStatus('error');
        setErrorMessage(params.error_description ?? params.error ?? 'OAuth error');
        return;
      }

      // PKCE flow: exchange the code for a session
      if (params.code) {
        callbackLog('Exchanging PKCE code from deep link...');
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(
            params.code,
          );
          if (error) {
            callbackLog('PKCE exchange failed from deep link', { message: error.message });
            clearTimeout(timeoutId);
            setStatus('error');
            setErrorMessage(error.message);
            return;
          }
          callbackLog('PKCE exchange succeeded from deep link — navigating to tabs');
          // onAuthStateChange(SIGNED_IN) fires → AuthHydrator updates store
          clearTimeout(timeoutId);
          router.replace('/(tabs)');
          return;
        } catch (e) {
          callbackLog('PKCE exchange threw', {
            error: e instanceof Error ? e.message : String(e),
          });
          clearTimeout(timeoutId);
          setStatus('error');
          setErrorMessage(e instanceof Error ? e.message : 'Code exchange failed');
          return;
        }
      }

      // Implicit flow: tokens are in URL hash — Expo Router passes them
      // as search params on some platforms
      if (params.access_token && params.refresh_token) {
        callbackLog('Setting session from implicit tokens (deep link)...');
        try {
          const { error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (error) {
            callbackLog('Implicit session set failed from deep link', { message: error.message });
            clearTimeout(timeoutId);
            setStatus('error');
            setErrorMessage(error.message);
            return;
          }
          callbackLog('Implicit session set succeeded — navigating to tabs');
          clearTimeout(timeoutId);
          router.replace('/(tabs)');
          return;
        } catch (e) {
          callbackLog('Implicit session set threw', {
            error: e instanceof Error ? e.message : String(e),
          });
          clearTimeout(timeoutId);
          setStatus('error');
          setErrorMessage(e instanceof Error ? e.message : 'Session set failed');
          return;
        }
      }

      // No params at all — likely arrived here via openAuthSessionAsync's
      // interception (path 1 above). Session is already set.
      // Verify the session actually exists before navigating.
      callbackLog('No params — checking if session already exists...');
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          callbackLog('Session exists — navigating to tabs', {
            userId: data.session.user.id,
          });
          clearTimeout(timeoutId);
          router.replace('/(tabs)');
        } else {
          callbackLog('No session found and no params — redirecting to login');
          clearTimeout(timeoutId);
          router.replace('/(auth)/login');
        }
      } catch (e) {
        callbackLog('Session check failed', {
          error: e instanceof Error ? e.message : String(e),
        });
        clearTimeout(timeoutId);
        router.replace('/(auth)/login');
      }
    };

    handleCallback();

    return () => clearTimeout(timeoutId);
  }, [params.code, params.access_token, params.refresh_token, params.error, params.error_description]);

  const handleRetry = () => {
    callbackLog('User tapped retry — redirecting to login');
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      {status === 'processing' && (
        <>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.text}>Signing you in…</Text>
          <Text style={styles.subText}>This should only take a moment</Text>
        </>
      )}

      {status === 'timeout' && (
        <>
          <Text style={styles.errorIcon}>⏱</Text>
          <Text style={styles.errorTitle}>Sign-in is taking too long</Text>
          <Text style={styles.subText}>
            The authentication didn&apos;t complete in time.{'\n'}
            Please try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>Back to Login</Text>
          </TouchableOpacity>
        </>
      )}

      {status === 'error' && (
        <>
          <Text style={styles.errorIcon}>✕</Text>
          <Text style={styles.errorTitle}>Sign-in failed</Text>
          <Text style={styles.subText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>Back to Login</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0B',
    gap: 12,
    paddingHorizontal: 32,
  },
  text: {
    color: '#A5B4FC',
    fontSize: 16,
    fontWeight: '500',
  },
  subText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  errorTitle: {
    color: '#F87171',
    fontSize: 18,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  retryText: {
    color: '#A5B4FC',
    fontSize: 15,
    fontWeight: '600',
  },
});
