/**
 * /api/auth/callback
 *
 * Web OAuth callback handler for Supabase Google Sign-In.
 * 
 * This route handles the redirect from Supabase after Google authentication.
 * It exchanges the auth code for a session and redirects the browser back
 * to the app with the session stored in cookies.
 */
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  console.info('[api/auth/callback] Received OAuth callback', {
    hasCode: Boolean(code),
    hasError: Boolean(error),
    error,
    errorDescription: error_description,
  });

  // Handle OAuth errors from the provider
  if (error) {
    console.error('[api/auth/callback] OAuth error:', error, error_description);
    // Redirect to faculty login page with error
    const loginUrl = new URL('/app/faculty-login', requestUrl.origin);
    loginUrl.searchParams.set('authError', error_description || error);
    return NextResponse.redirect(loginUrl.toString());
  }

  // Exchange code for session
  if (code) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('[api/auth/callback] Code exchange failed:', exchangeError);
      const loginUrl = new URL('/app/faculty-login', requestUrl.origin);
      loginUrl.searchParams.set('authError', exchangeError.message);
      return NextResponse.redirect(loginUrl.toString());
    }

    console.info('[api/auth/callback] Session created successfully', {
      userId: data.session?.user.id,
      email: data.session?.user.email,
    });

    // Redirect to the faculty login page
    // The session is now stored in cookies by Supabase
    // The app will detect the session via onAuthStateChange
    const redirectUrl = new URL('/app/faculty-login', requestUrl.origin);
    redirectUrl.searchParams.set('oauth_success', '1');
    return NextResponse.redirect(redirectUrl.toString());
  }

  // No code and no error - redirect to faculty login
  console.warn('[api/auth/callback] No code in callback URL');
  const loginUrl = new URL('/app/faculty-login', requestUrl.origin);
  loginUrl.searchParams.set('authError', 'Authentication failed - no authorization code received');
  return NextResponse.redirect(loginUrl.toString());
}