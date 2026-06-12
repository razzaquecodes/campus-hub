import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';


// ─── IMPORTANT: maybeCompleteAuthSession() must NOT be called here.
// It must be called inside oauth-callback.tsx (the route that renders at the
// redirect URL). Calling it at module scope in a service file does nothing
// useful on iOS and can interfere with the auth session on Android.
// See: oauth-callback.tsx line 1.

// ─── Environment detection ────────────────────────────────────────────────────
const OAUTH_CALLBACK_PATH = 'oauth-callback';
const APP_SCHEME = String(
  Constants.expoConfig?.extra?.oauthScheme ?? Constants.expoConfig?.scheme ?? 'campushub',
);

// ─── Debug logging with timestamps ────────────────────────────────────────────
function authLog(message: string, details?: Record<string, unknown>) {
  const ts = new Date().toISOString().slice(11, 23);
  const payload = details ? ` ${JSON.stringify(details)}` : '';
  console.info(`[auth][${ts}] ${message}${payload}`);
}

// ─── Platform-specific redirect URIs ───────────────────────────────────────────
//
// Web OAuth requires a dedicated callback endpoint, while native OAuth uses deep links.
//
function getRedirectUri(): string {
  const isWeb = Platform.OS === 'web';
  const isDev = __DEV__;
  
  if (isWeb) {
    // Web: Use dedicated callback endpoint
    // In development: http://localhost:3000/api/auth/callback
    // In production: https://campushubq.vercel.app/api/auth/callback
    const debuggerHost = Constants.expoConfig?.hostUri;
    
    if (isDev && debuggerHost) {
      // Development: use localhost with the port from debuggerHost
      const ipAndPort = debuggerHost.split(':');
      const port = ipAndPort[2] || '3000';
      return `http://${ipAndPort[0]}:${port}/api/auth/callback`;
    }
    
    // Production or fallback
    return `https://campushubq.vercel.app/api/auth/callback`;
  }
  
  // Native (iOS/Android): Use deep link scheme
  return `campushub://oauth-callback`;
}

// Native redirect URI for Supabase configuration (used in signInWithOAuth)
const NATIVE_REDIRECT_URI = `${APP_SCHEME}://${OAUTH_CALLBACK_PATH}`;

// Build the redirect URI for OAuth callback.
export const REDIRECT_URI: string = getRedirectUri();

authLog('Redirect URI computed', {
  redirectUri: REDIRECT_URI,
  nativeUri: NATIVE_REDIRECT_URI,
  scheme: APP_SCHEME,
  platform: Platform.OS,
  isDev: __DEV__,
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
// IMPORTANT: The redirect URI passed to Supabase must be EXACTLY what is
// registered in Supabase. Do NOT add query parameters to redirectTo.
//
export async function signInWithGoogle(): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');

  const isWeb = Platform.OS === 'web';
  
  // Get the redirect URI for Supabase - web uses web callback, native uses deep link
  const supabaseRedirectUri = isWeb ? REDIRECT_URI : NATIVE_REDIRECT_URI;

  authLog('▶ Starting Google OAuth', {
    executionEnvironment: Constants.executionEnvironment,
    appOwnership: Constants.appOwnership,
    platform: Platform.OS,
    redirectUri: REDIRECT_URI,
    supabaseRedirectUri,
    nativeUri: NATIVE_REDIRECT_URI,
    scheme: APP_SCHEME,
    isWeb,
  });

  // Step 1: Get the Google OAuth URL from Supabase.
  //   With flowType:'pkce', Supabase generates a code_verifier, stores it
  //   in AsyncStorage, and embeds code_challenge in the returned URL.
  authLog('Step 1: Requesting OAuth URL from Supabase...');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: supabaseRedirectUri,
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
    redirectUri: supabaseRedirectUri,
    oauthUrl: __DEV__ ? data.url : '(redacted)',
  });

  // Step 2: Open Google sign-in in ASWebAuthenticationSession (iOS) /
  //   Chrome Custom Tab (Android) / Browser tab (web).
  //
  //   For web: use openAuthSessionAsync with the OAuth URL
  //   The redirect URL must match what we registered in Supabase
  //
  authLog('Step 2: Opening browser for Google consent...');
  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    REDIRECT_URI, // Return URL to detect callback
  );

  authLog('Step 2 complete — browser result', {
    type: result.type,
    hasUrl: result.type === 'success' ? Boolean(result.url) : false,
    isWeb,
  });

  if (result.type === 'cancel' || result.type === 'dismiss') {
    authLog('✗ User cancelled sign-in');
    throw new Error('Sign-in was cancelled');
  }

  if (result.type !== 'success') {
    authLog('✗ Authentication failed — unexpected result type', { type: result.type });
    throw new Error('Authentication failed');
  }

  // Step 3: For web with server-side callback handling
  // The callback page (/api/auth/callback) exchanges the code for a session
  // and stores it in cookies/localStorage. The callback page then redirects
  // to the app. In this case, openAuthSessionAsync might return without a URL.
  //
  // For native, the deep link contains the code which we parse here.
  //
  // We first try to parse the URL for a code. If none is found on web,
  // we check if a session already exists (set by the callback page).
  const params = result.url ? parseUrlParams(result.url) : {};
  
  authLog('Step 3: Parsed callback info', {
    hasCode: Boolean(params.code),
    hasAccessToken: Boolean(params.access_token),
    hasRefreshToken: Boolean(params.refresh_token),
    hasError: Boolean(params.error),
    url: result.url ? (__DEV__ ? result.url.slice(0, 120) + '...' : '(redacted)') : '(no URL returned - server-side redirect handled)',
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
  // Step 4b: For web, the callback page handles the code exchange
  // If no code was returned, check if a session already exists
  else if (isWeb) {
    authLog('Step 4 (web): Checking for existing session from callback page...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      authLog('✗ Failed to retrieve session after callback', { message: sessionError.message });
      throw new Error('Failed to retrieve session after authentication.');
    }
    if (!sessionData?.session) {
      authLog('✗ No session found after callback — callback page may have failed');
      throw new Error('Authentication completed but no session was created. Please try again.');
    }
    authLog('Step 4 ✓ Web callback session verified', {
      hasSession: Boolean(sessionData.session),
      userId: sessionData.session.user.id ?? null,
      email: sessionData.session.user.email ?? null,
    });
    // Session is already set, skip to verification
    authLog('Step 5: Session already verified (set by callback page)');
    authLog('✓ Google OAuth flow complete', {
      userId: sessionData.session.user.id,
      email: sessionData.session.user.email,
    });
    return;
  }
  // Step 4c: Implicit fallback — tokens arrived in hash fragment.
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
      userId: sessionSetData.session?.user?.id ?? null,
      email: sessionSetData.session?.user?.email ?? null,
    });
  } else {
    authLog('✗ No tokens or code in callback URL');
    throw new Error(
      `OAuth callback received but contained no tokens or code.
URL: ${result.url || 'none'}`,
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

// ─── Required Supabase Configuration ─────────────────────────────────────────
//
// For Faculty Google OAuth to work, the following MUST be configured in
// your Supabase project (Dashboard → Authentication → URL Configuration):
//
// REDIRECT URLs (add ALL of these):
//   - https://campushubq.vercel.app/api/auth/callback  (web production)
//   - http://localhost:3000/api/auth/callback           (web development)
//   - campushub://oauth-callback                       (iOS/Android native)
//   - exp://*/--/oauth-callback                         (Expo Go development)
//
// To add a redirect URL:
//   1. Go to https://supabase.com/dashboard
//   2. Select your project (czfylavvvwwohqkrhbdb)
//   3. Navigate to Authentication → URL Configuration
//   4. Add the redirect URLs in the "Redirect URLs" field
//   5. Click "Save"
//
// GOOGLE OAuth Provider settings (Authentication → Providers → Google):
//   - Client ID: Your Google Cloud OAuth 2.0 Client ID
//   - Client Secret: Your Google Cloud OAuth 2.0 Client Secret
//   - Authorized redirect URI: https://czfylavvvwwohqkrhbdb.supabase.co/auth/v1/callback
//
// For iOS native OAuth:
//   - The app scheme "campushub" is registered in app.config.ts
//   - CFBundleURLTypes includes the scheme in Info.plist
//
// For Android native OAuth:
//   - Intent filters for the "campushub" scheme are configured in app.config.ts
//   - android.intentFilters.BROWSABLE category is set
//
