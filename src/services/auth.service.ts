import { makeRedirectUri } from 'expo-auth-session';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types/database';

// Required on iOS: completes the browser session on redirect
WebBrowser.maybeCompleteAuthSession();

// ─── Environment detection ────────────────────────────────────────────────────
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
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
// ASWebAuthenticationSession (iOS) intercepts OAuth callbacks by URL scheme.
// The scheme MUST be registered in the hosting app's Info.plist, or the
// browser stays open after auth — which is the bug we're fixing.
//
// Registered schemes per environment:
//
//   Expo Go        → 'exp'        (registered in Expo Go's own Info.plist)
//   Dev / Standalone → 'campushub' (registered via scheme: "campushub" in app.config.ts)
//   Web            → 'http(s)'    (standard browser)
//
// Therefore:
//   Expo Go uses    exp://IP:PORT/--/oauth-callback   ← exp is registered ✅
//   Standalone uses campushub://oauth-callback        ← campushub registered ✅
//   Web uses        http://localhost:PORT/            ← standard ✅
//
// Supabase redirect URLs to add:
//   campushub://oauth-callback     (standalone)
//   exp://**                       (Expo Go wildcard — covers all IPs)
//
export const REDIRECT_URI: string = (() => {
  if (Platform.OS === 'web') {
    return makeRedirectUri({ path: OAUTH_CALLBACK_PATH });
  }
  if (isExpoGo) {
    // Linking.createURL uses the actual Metro LAN IP/port Expo Go is
    // running on — the same address the device already uses to load the
    // JS bundle, so it is always reachable.
    return Linking.createURL(OAUTH_CALLBACK_PATH);
    // → exp://192.0.0.2:8081/--/oauth-callback  (or whatever the real IP is)
  }
  // Standalone / Dev Build: campushub:// is registered in Info.plist
  return makeRedirectUri({
    scheme: APP_SCHEME,
    path: OAUTH_CALLBACK_PATH,
  });
})();

authLog('Redirect URI computed', {
  redirectUri: REDIRECT_URI,
  isExpoGo,
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
  });

  // Step 2: Open Google sign-in in ASWebAuthenticationSession (iOS) /
  //   Chrome Custom Tab (Android). The session monitors for any redirect
  //   to a URL whose scheme matches REDIRECT_URI and closes automatically.
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
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
    if (exchangeError) {
      authLog('✗ PKCE code exchange failed', { message: exchangeError.message });
      throw exchangeError;
    }
    authLog('Step 4 ✓ PKCE code exchange succeeded — onAuthStateChange(SIGNED_IN) will fire');
  }
  // Step 4b: Implicit fallback — tokens arrived in hash fragment.
  else if (params.access_token && params.refresh_token) {
    authLog('Step 4: Setting session from implicit tokens...');
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (sessionError) {
      authLog('✗ Implicit token session set failed', { message: sessionError.message });
      throw sessionError;
    }
    authLog('Step 4 ✓ Implicit session set succeeded — onAuthStateChange(SIGNED_IN) will fire');
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

  // NOTE: We do NOT set the profile in the store here.
  // AuthHydrator.onAuthStateChange(SIGNED_IN) handles that reactively.
  // The store's signInWithGoogle() method waits for the profile to be set.
}

// ─── Session restore ──────────────────────────────────────────────────────────
export async function getPersistedSession(): Promise<UserProfile | null> {
  if (!supabase) return null;

  authLog('Restoring persisted session...');
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    authLog('Session restore failed', { message: error.message });
    return null;
  }
  if (!data.session?.user) {
    authLog('No persisted session found');
    return null;
  }

  const { user } = data.session;
  authLog('Session found', { userId: user.id, email: user.email });

  const { data: profileRow, error: profileError } = await supabase
    .from('users')
    .select('*, branch:branches(*)')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    authLog('Profile fetch failed', { message: profileError.message, userId: user.id });
  }

  if (profileRow) {
    authLog('Existing profile found in DB');
    return mapDbUser(profileRow as Record<string, unknown>);
  }

  // First login — create the profile row
  authLog('First login — creating profile row', { userId: user.id });
  const newProfile = {
    id: user.id,
    roll_number: '', // Will be set when user connects MAKAUT, or can be set manually
    email: user.email!,
    full_name:
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email?.split('@')[0] ??
      'Student',
    role: 'student' as const,
    college: 'Budge Budge Institute of Technology',
    is_verified: true,
    avatar_url:
      user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
  };

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (existingUser) {
    // If it somehow exists but the initial select didn't catch it
    authLog('User row exists (race condition) — updating');
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update(newProfile)
      .eq('id', user.id)
      .select('*')
      .single();
      
    if (updateError) {
      authLog('Update failed — using metadata fallback', { message: updateError.message });
      return mapDbUser(newProfile as unknown as Record<string, unknown>);
    }
    return mapDbUser(updated as Record<string, unknown>);
  }

  const { data: inserted, error: insertError } = await supabase
    .from('users')
    .insert(newProfile)
    .select('*')
    .single();

  if (insertError) {
    authLog('Profile insert failed; using auth metadata fallback', {
      message: insertError.message,
      userId: user.id,
    });
    return mapDbUser(newProfile as unknown as Record<string, unknown>);
  }

  authLog('Profile created successfully');
  return mapDbUser(inserted as Record<string, unknown>);
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

// ─── DB row → UserProfile ─────────────────────────────────────────────────────
function mapDbUser(row: Record<string, unknown>): UserProfile {
  const branch = row.branch as Record<string, unknown> | null;
  return {
    id: row.id as string,
    roll_number: row.roll_number as string,
    email: row.email as string,
    full_name: row.full_name as string,
    role: (row.role as UserProfile['role']) || 'student',
    branch_id: row.branch_id as string | null,
    semester_id: row.semester_id as string | null,
    section_id: row.section_id as string | null,
    branch: branch
      ? (branch.name as string)
      : (row.branch as string | null),
    semester: row.semester as string | null,
    section: row.section as string | null,
    year: row.year as string | null,
    batch: row.batch as string | null,
    advisor: row.advisor as string | null,
    phone: row.phone as string | null,
    hostel_block: row.hostel_block as string | null,
    hostel_room: row.hostel_room as string | null,
    college: (row.college as string) || 'BBIT',
    avatar_url: row.avatar_url as string | null,
    is_verified:
      row.is_verified !== undefined ? Boolean(row.is_verified) : false,
  };
}
