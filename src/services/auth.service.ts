import { MOCK_PROFILE } from '@/constants/mock-data';
import { isSupabaseConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { MakautCredentials, MakautVerifiedProfile, UserProfile } from '@/types/database';

import { verifyMakautCredentials } from './makaut.service';

const SESSION_KEY = 'campushub_session';

export async function signInWithMakaut(credentials: MakautCredentials): Promise<{
  profile: UserProfile;
  accessToken: string | null;
}> {
  const makautProfile = await verifyMakautCredentials(credentials);

  if (isSupabaseConfigured && supabase) {
    const email = makautProfile.email;
    const password = credentials.password;

    const signInResult = await supabase.auth.signInWithPassword({ email, password });

    if (signInResult.error?.message?.includes('Invalid login')) {
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
      const userId = signUpResult.data.user?.id;
      if (!userId) throw new Error('Authentication failed');
      const profile = await upsertUserProfile(userId, makautProfile);
      return { profile, accessToken: signUpResult.data.session?.access_token ?? null };
    }

    if (signInResult.error) throw signInResult.error;

    const userId = signInResult.data.user?.id;
    if (!userId) throw new Error('Authentication failed');

    const profile = await upsertUserProfile(userId, makautProfile);
    const token = signInResult.data.session?.access_token ?? null;

    return { profile, accessToken: token };
  }

  // Offline / demo mode
  const profile: UserProfile = {
    ...MOCK_PROFILE,
    roll_number: makautProfile.roll_number,
    email: makautProfile.email,
    full_name: makautProfile.full_name,
    is_verified: true,
    branch: {
      id: 'branch-cse',
      code: makautProfile.branch_code,
      name: makautProfile.branch_name,
    },
    semester: {
      id: 'sem-4',
      number: makautProfile.semester,
      branch_id: 'branch-cse',
      academic_year: '2024-25',
    },
    section: {
      id: 'sec-a',
      code: makautProfile.section,
      semester_id: 'sem-4',
    },
    college: makautProfile.college,
  };

  return { profile, accessToken: 'demo-token' };
}

async function upsertUserProfile(
  userId: string,
  makaut: MakautVerifiedProfile,
): Promise<UserProfile> {
  if (!supabase) return MOCK_PROFILE;

  const { data: branchData } = await supabase
    .from('branches')
    .select('id, code, name')
    .eq('code', makaut.branch_code)
    .maybeSingle();
  const branch = branchData as { id: string; code: string; name: string } | null;

  const profileRow = {
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
    .upsert(profileRow)
    .select('*')
    .single();

  const data = upserted as Record<string, unknown> | null;

  if (error) {
    console.warn('[auth] Profile upsert failed, using parsed data:', error.message);
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

  if (!data) {
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
    };
  }

  return mapDbUser(data);
}

function mapDbUser(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    roll_number: row.roll_number as string,
    email: row.email as string,
    full_name: row.full_name as string,
    role: row.role as UserProfile['role'],
    branch_id: row.branch_id as string | null,
    semester_id: row.semester_id as string | null,
    section_id: row.section_id as string | null,
    college: row.college as string,
    avatar_url: row.avatar_url as string | null,
    is_verified: Boolean(row.is_verified),
    branch: row.branch as UserProfile['branch'],
  };
}

export async function signOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
}

export async function getPersistedSession(): Promise<UserProfile | null> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('*, branch:branches(*)')
      .eq('id', data.session.user.id)
      .maybeSingle();

    if (profile) return mapDbUser(profile as Record<string, unknown>);
  }

  return null;
}

export { SESSION_KEY };
