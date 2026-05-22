/**
 * auth.service.ts
 *
 * Production authentication service.
 *
 * Sign-in flow:
 *  1. verifyMakautCredentials  → validated student profile from backend
 *  2. supabase.auth.signInWithPassword (try) / signUp (first-time)
 *  3. upsert user row in `users` table
 *  4. Return full UserProfile + Supabase session tokens
 *
 * Offline / demo: no Supabase needed — returns a realistic profile.
 *
 * Session persistence: Supabase SDK handles access/refresh tokens via
 * AsyncStorage (configured in supabase.ts). We persist a lightweight
 * UserProfile snapshot in SecureStore as a fast-read cache.
 */

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { MakautCredentials, MakautVerifiedProfile, UserProfile } from '@/types/database';

import { verifyMakautCredentials } from './makaut.service';

// ─── Sign in ──────────────────────────────────────────────────────────────────

export interface SignInResult {
  profile: UserProfile;
  /** Supabase JWT access token, or 'demo-token' in offline mode */
  accessToken: string;
  /** True when this is the user's first-ever sign-in */
  isNewUser: boolean;
}

export async function signInWithMakaut(credentials: MakautCredentials): Promise<SignInResult> {
  // Step 1 — verify against MAKAUT portal (via backend)
  const makautProfile = await verifyMakautCredentials(credentials);

  // Step 2 — Supabase auth
  if (isSupabaseConfigured && supabase) {
    return supabaseSignIn(credentials.password, makautProfile);
  }

  // Offline / demo mode
  return offlineSignIn(makautProfile);
}

// ─── Supabase path ────────────────────────────────────────────────────────────

async function supabaseSignIn(
  password: string,
  makautProfile: MakautVerifiedProfile,
): Promise<SignInResult> {
  if (!supabase) throw new Error('Supabase client not initialised');

  const email = makautProfile.email;
  let userId: string;
  let accessToken: string;
  let isNewUser = false;

  // Try sign-in first
  const signInResult = await supabase.auth.signInWithPassword({ email, password });

  if (signInResult.error) {
    // First-time user → sign up
    if (
      signInResult.error.message.toLowerCase().includes('invalid') ||
      signInResult.error.message.toLowerCase().includes('credentials') ||
      signInResult.error.message.toLowerCase().includes('not found') ||
      signInResult.error.status === 400
    ) {
      const signUpResult = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: makautProfile.full_name,
            roll_number: makautProfile.roll_number,
          },
        },
      });
      if (signUpResult.error) throw signUpResult.error;
      if (!signUpResult.data.user?.id) throw new Error('Sign-up did not return a user ID.');

      userId = signUpResult.data.user.id;
      accessToken = signUpResult.data.session?.access_token ?? '';
      isNewUser = true;
    } else {
      throw signInResult.error;
    }
  } else {
    if (!signInResult.data.user?.id) throw new Error('Sign-in did not return a user ID.');
    userId = signInResult.data.user.id;
    accessToken = signInResult.data.session?.access_token ?? '';
  }

  const profile = await upsertUserProfile(userId, makautProfile);
  return { profile, accessToken, isNewUser };
}

// ─── Offline/demo path ────────────────────────────────────────────────────────

function offlineSignIn(makautProfile: MakautVerifiedProfile): SignInResult {
  const profile: UserProfile = {
    id: `demo-${makautProfile.roll_number}`,
    roll_number: makautProfile.roll_number,
    email: makautProfile.email,
    full_name: makautProfile.full_name,
    role: 'student',
    branch_id: 'branch-cse',
    semester_id: `sem-${makautProfile.semester}`,
    section_id: `sec-${makautProfile.section}`,
    college: makautProfile.college,
    is_verified: true,
    branch: {
      id: 'branch-cse',
      code: makautProfile.branch_code,
      name: makautProfile.branch_name,
    },
    semester: {
      id: `sem-${makautProfile.semester}`,
      number: makautProfile.semester,
      branch_id: 'branch-cse',
      academic_year: '2024-25',
    },
    section: {
      id: `sec-${makautProfile.section}`,
      code: makautProfile.section,
      semester_id: `sem-${makautProfile.semester}`,
    },
  };
  return { profile, accessToken: 'demo-token', isNewUser: false };
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────

async function upsertUserProfile(
  userId: string,
  makaut: MakautVerifiedProfile,
): Promise<UserProfile> {
  if (!supabase) throw new Error('Supabase not available');

  // Resolve branch
  const { data: branchData } = await supabase
    .from('branches')
    .select('id, code, name')
    .eq('code', makaut.branch_code)
    .maybeSingle();
  const branch = branchData as { id: string; code: string; name: string } | null;

  const row = {
    id: userId,
    roll_number: makaut.roll_number,
    email: makaut.email,
    full_name: makaut.full_name,
    role: 'student' as const,
    branch_id: branch?.id ?? null,
    college: makaut.college,
    is_verified: true,
    makaut_verified_at: new Date().toISOString(),
  };

  const { data: upserted, error } = await supabase
    .from('users')
    .upsert(row, { onConflict: 'id' })
    .select('*, branch:branches(*), semester:semesters(*), section:sections(*)')
    .single();

  if (error) {
    // Upsert failed — return best-effort profile so the user still gets in
    console.warn('[auth] upsert error:', error.message);
    return {
      id: userId,
      roll_number: makaut.roll_number,
      email: makaut.email,
      full_name: makaut.full_name,
      role: 'student',
      branch_id: branch?.id ?? null,
      semester_id: null,
      section_id: null,
      college: makaut.college,
      is_verified: true,
      branch: branch ?? { id: '', code: makaut.branch_code, name: makaut.branch_name },
    };
  }

  return mapDbUser(upserted as Record<string, unknown>);
}

function mapDbUser(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    roll_number: row.roll_number as string,
    email: row.email as string,
    full_name: row.full_name as string,
    role: (row.role as UserProfile['role']) ?? 'student',
    branch_id: row.branch_id as string | null,
    semester_id: row.semester_id as string | null,
    section_id: row.section_id as string | null,
    college: (row.college as string) ?? '',
    avatar_url: (row.avatar_url as string | null) ?? null,
    is_verified: Boolean(row.is_verified),
    branch: row.branch as UserProfile['branch'],
    semester: row.semester as UserProfile['semester'],
    section: row.section as UserProfile['section'],
  };
}

// ─── Session management ───────────────────────────────────────────────────────

/** Read the persisted Supabase session and return a full profile if valid. */
export async function getPersistedSession(): Promise<UserProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*, branch:branches(*), semester:semesters(*), section:sections(*)')
    .eq('id', data.session.user.id)
    .maybeSingle();

  if (profileError || !profile) return null;
  return mapDbUser(profile as Record<string, unknown>);
}

/** Refresh the Supabase access token. Returns the new token or null. */
export async function refreshSession(): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.refreshSession();
  if (error) return null;
  return data.session?.access_token ?? null;
}

/** Sign out from Supabase (clears stored tokens). */
export async function signOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
}
