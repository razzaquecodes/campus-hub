import { Env } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { StudentProfile, UserProfile } from '@/types/database';

/**
 * Fetch the linked MAKAUT profile for a given user ID
 */
export async function getMakautProfile(userId: string): Promise<StudentProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[makaut.service] Error fetching makaut profile:', error);
    return null;
  }

  return data as StudentProfile | null;
}

/**
 * Mocks connecting to MAKAUT and fetching academic data.
 * In a real app, this would hit an API endpoint or a secure backend service
 * that performs the scraping/API call to MAKAUT and returns the data.
 */
export async function linkMakautAccount(
  userId: string,
  rollNumber: string,
  password: string,
  existingProfile: UserProfile
): Promise<StudentProfile> {
  if (!supabase) throw new Error('Supabase not configured');
  if (!Env.makautApiUrl) throw new Error('MAKAUT verification endpoint is not configured.');

  // The backend function is responsible for verifying credentials against MAKAUT,
  // fetching the student's data, and returning it.
  // The function should NOT return the password.
  const response = await fetch(Env.makautApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Pass the Supabase JWT to authorize the user on the backend
      Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({
      rollNumber,
      password,
      userId, // Pass userId for linking
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
    throw new Error(errorBody.message || 'Failed to connect MAKAUT account.');
  }

  const makautData = await response.json();

  // The backend function should return data that can be upserted into student_profiles.
  // It should also handle the upsert itself for better security and data integrity.
  // Here we assume the backend does the upsert and returns the final profile.
  const studentProfile: StudentProfile = {
    ...makautData,
    last_synced_at: new Date().toISOString(),
  };

  // The backend Edge Function should have already performed the upsert.
  // The client receives the confirmed, up-to-date profile.
  return studentProfile;
}
