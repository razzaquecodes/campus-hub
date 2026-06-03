import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types/database';

// ─── IMPORTANT: maybeCompleteAuthSession() must NOT be called here.
// It must be called inside oauth-callback.tsx (the route that renders at the
// redirect URL). Calling it at module scope in a service file does nothing
// useful on iOS and can interfere with the auth session on Android.
// See: oauth-callback.tsx line 1.

// ─── Environment detection ────────────────────────────────────────────────────
const OAUTH_CALLBACK_PATH = 'oauth-callback';
const APP_SCHEME =
  String(Constants.expoConfig?.extra?.oauthScheme ?? Constants.expoConfig?.scheme ?? 'campushub');

// ─── Debug logging with timestamps ────────────────────────────────────────────
function authLog(message: string, details?: Record<string, unknown>) {
  const ts = new Date().toISOString().slice(11, 23);
  const payload = details ? ` ${JSON.stringify(details)}` : '';
  console.info(`[auth][${ts}] ${message}${payload}`);
}

// ─── Redirect URI ─────────────────────────────────────────────────────────────
//
// HOW THE OAUTH CALLBACK WORKS:
//
//   App ──→ Supabase /auth/v1/authorize ──→ Google Consent ──→
//   Google ──→ Supabase /auth/v1/callback ──→ YOUR APP (via scheme)
//
// The redirect URI registered in Supabase and the one passed to signInWithOAuth
// must match EXACTLY (after Supabase processes it).
//
// ENVIRONMENTS:
//
//   Expo Go (storeClient)
//     makeRedirectUri falls through to Expo Linking.createURL() with scheme override
//     → produces: exp://<IP>:<PORT>/--/oauth-callback
//     Supabase must allow: exp://*/--/oauth-callback  (wildcard)
//
//   Development build / Standalone (bare / standalone executionEnvironment)
//     The `native` parameter is used: campushub://oauth-callback
//     Supabase must allow: campushub://oauth-callback
//     iOS Info.plist must register: campushub (already done in app.config.ts)
//
//   Web
//     Linking.createURL() produces https://localhost:PORT/oauth-callback
//
// WHY `native` MATTERS:
//   In makeRedirectUri(), when executionEnvironment is 'bare' or 'standalone',
//   the function returns the `native` value directly, bypassing Linking.createURL().
//   This guarantees a stable, predictable URI that never includes a dynamic IP.
//
const NATIVE_REDIRECT_URI = `${APP_SCHEME}://${OAUTH_CALLBACK_PATH}`;

export const REDIRECT_URI: string = makeRedirectUri({
  // native: returned directly in standalone/bare builds (most important)
  native: NATIVE_REDIRECT_URI,
  // scheme: used by makeRedirectUri in Expo Go (storeClient) via Linking.createURL
  scheme: APP_SCHEME,
  path: OAUTH_CALLBACK_PATH,
});

authLog('Redirect URI computed', {
  redirectUri: REDIRECT_URI,
  nativeUri: NATIVE_REDIRECT_URI,
  scheme: APP_SCHEME,
  platform: Platform.OS,
  executionEnvironment: Constants.executionEnvironment,
});

// ─── URL token parser ─────────────────────────────────────────────────────────
//
// PKCE  → ?code=XXXX              (query param)
// Implicit → #access_token=X&refresh_token=Y  (hash fragment)
//
function parseUrlParams(url: string): Record<string, string> {
  const result: Record<string, string> = {};

  const hashIdx = url.indexOf('#');
  if (hashIdx !== -1) {
    for (const pair of url.slice(hashIdx + 1).split('&')) {
      const eq = pair.indexOf('=');
      if (eq > 0) {
        result[decodeURIComponent(pair.slice(0, eq))] =
          decodeURIComponent(pair.slice(eq + 1));
      }
    }
  }

  const qIdx = url.indexOf('?');
  const qEnd = hashIdx !== -1 ? hashIdx : url.length;
  if (qIdx !== -1 && qIdx < qEnd) {
    for (const pair of url.slice(qIdx + 1, qEnd).split('&')) {
      const eq = pair.indexOf('=');
      if (eq > 0) {
        result[decodeURIComponent(pair.slice(0, eq))] =
          decodeURIComponent(pair.slice(eq + 1));
      }
    }
  }

  return result;
}

// ─── Google Sign-In ───────────────────────────────────────────────────────────
//
// This function handles the OAuth browser flow and session exchange ONLY.
// It does NOT fetch or set the user profile — that is the job of
// AuthHydrator.onAuthStateChange(SIGNED_IN), which fires automatically
// after exchangeCodeForSession() / setSession() succeeds.
//
// This architecture ensures a single source of truth for profile state
// and eliminates the race condition where both this function and
// AuthHydrator were calling getPersistedSession() concurrently.
//
export async function signInWithGoogle(): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');

  authLog('▶ Starting Google OAuth', {
    executionEnvironment: Constants.executionEnvironment,
    appOwnership: Constants.appOwnership,
    platform: Platform.OS,
    redirectUri: REDIRECT_URI,
    nativeUri: NATIVE_REDIRECT_URI,
    scheme: APP_SCHEME,
  });

  // Step 1: Get the Google OAuth URL from Supabase.
  //   With flowType:'pkce', Supabase generates a code_verifier, stores it
  //   in AsyncStorage, and embeds code_challenge in the returned URL.
  authLog('Step 1: Requesting OAuth URL from Supabase...');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: REDIRECT_URI,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    authLog('✗ Supabase signInWithOAuth failed', { message: error.message });
    throw error;
  }
  if (!data?.url) throw new Error('No OAuth URL returned by Supabase');

  authLog('Step 1 ✓ OAuth URL created', {
    provider: 'google',
    authHost: safeHost(data.url),
    redirectUri: REDIRECT_URI,
    oauthUrl: __DEV__ ? data.url : '(redacted)',
  });

  // Step 2: Open Google sign-in in ASWebAuthenticationSession (iOS) /
  //   Chrome Custom Tab (Android). The session monitors for any redirect
  //   to a URL whose scheme matches REDIRECT_URI and closes automatically.
  //
  //   CRITICAL: openAuthSessionAsync's second argument is the "redirect URL prefix"
  //   that the in-app browser watches for to auto-close. It MUST match the scheme
  //   of the redirect URI we sent to Supabase. We pass REDIRECT_URI here so that:
  //   - In Expo Go: the exp:// prefix is used
  //   - In standalone/bare: the campushub:// prefix is used
  //
  authLog('Step 2: Opening browser for Google consent...');
  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    REDIRECT_URI,
  );

  authLog('Step 2 complete — browser result', {
    type: result.type,
    hasUrl: result.type === 'success' ? Boolean(result.url) : false,
    callbackScheme: result.type === 'success' ? safeScheme(result.url) : null,
  });

  if (result.type === 'cancel' || result.type === 'dismiss') {
    authLog('✗ User cancelled sign-in');
    throw new Error('Sign-in was cancelled');
  }

  if (result.type !== 'success' || !result.url) {
    authLog('✗ Authentication failed — unexpected result type', { type: result.type });
    throw new Error('Authentication failed');
  }

  // Step 3: Extract credentials from the callback URL.
  const params = parseUrlParams(result.url);
  authLog('Step 3: Parsed callback URL', {
    hasCode: Boolean(params.code),
    hasAccessToken: Boolean(params.access_token),
    hasRefreshToken: Boolean(params.refresh_token),
    hasError: Boolean(params.error),
    url: __DEV__ ? result.url.slice(0, 120) + '...' : '(redacted)',
    rawUrl: __DEV__ ? result.url : '(redacted)',
  });

  if (params.error) {
    authLog('✗ OAuth callback returned provider error', {
      error: params.error,
      errorDescription: params.error_description,
    });
    throw new Error(params.error_description ?? params.error);
  }

  // Step 4a: PKCE (preferred) — exchange the code for a session.
  if (params.code) {
    authLog('Step 4: Exchanging PKCE code for session...');
    const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
    if (exchangeError) {
      authLog('✗ PKCE code exchange failed', { message: exchangeError.message });
      throw exchangeError;
    }
    authLog('Step 4 ✓ PKCE code exchange succeeded — session received', {
      hasSession: Boolean(exchangeData.session),
      userId: exchangeData.session?.user.id ?? null,
      email: exchangeData.session?.user.email ?? null,
    });
  }
  // Step 4b: Implicit fallback — tokens arrived in hash fragment.
  else if (params.access_token && params.refresh_token) {
    authLog('Step 4: Setting session from implicit tokens...');
    const { data: sessionSetData, error: sessionError } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (sessionError) {
      authLog('✗ Implicit token session set failed', { message: sessionError.message });
      throw sessionError;
    }
    authLog('Step 4 ✓ Implicit session set succeeded — session received', {
      hasSession: Boolean(sessionSetData.session),
      userId: sessionSetData.session?.user.id ?? null,
      email: sessionSetData.session?.user.email ?? null,
    });
  } else {
    authLog('✗ No tokens or code in callback URL');
    throw new Error(
      `OAuth callback received but contained no tokens or code.\nURL: ${result.url}`,
    );
  }

  // Step 5: Verify session was actually set
  authLog('Step 5: Verifying session...');
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session) {
    authLog('✗ Session verification failed — no session after exchange');
    throw new Error('Session exchange completed but no session found');
  }

  authLog('✓ Google OAuth flow complete — session verified', {
    userId: sessionData.session.user.id,
    email: sessionData.session.user.email,
    expiresAt: sessionData.session.expires_at,
  });

  // For the Admin flow, the caller (admin-login.tsx) will now manually call 
  // supabase.auth.getUser() and verify against the admins table.
}



function safeHost(value?: string): string | null {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

function safeScheme(value?: string): string | null {
  if (!value) return null;
  const match = value.match(/^([a-z][a-z0-9+.-]*):/i);
  return match?.[1] ?? null;
}

// ─── Sign out ─────────────────────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  authLog('Signing out...');
  if (supabase) {
    await supabase.auth.signOut();
    authLog('Signed out successfully');
  }
}

