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
export async function connectMakautAccount(
  userId: string,
  rollNumber: string,
  password: string, // Currently not used in the mock, but would be sent to the backend securely
  existingProfile: UserProfile
): Promise<StudentProfile> {
  if (!supabase) throw new Error('Supabase not configured');

  // Simulate network delay for "verification"
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock checking validity (e.g. valid length of roll number)
  if (rollNumber.length < 5) {
    throw new Error('Invalid MAKAUT Roll Number');
  }

  // Mocked data that would theoretically be returned from MAKAUT
  const mockedMakautData = {
    user_id: userId,
    full_name: existingProfile.full_name,
    roll_number: rollNumber,
    registration_number: `REG${Math.floor(Math.random() * 9000000) + 1000000}`,
    email: existingProfile.email,
    mobile: existingProfile.phone || `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    institute_name: 'Budge Budge Institute of Technology',
    course_name: 'B.Tech in Computer Science & Engineering',
    abc_id: `ABC-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
    photo_url: existingProfile.avatar_url,
    last_synced_at: new Date().toISOString(),
  };

  // Check if profile exists
  const { data: existingMakaut } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  let data, error;
  
  if (existingMakaut) {
    // Update existing
    ({ data, error } = await supabase
      .from('student_profiles')
      .update(mockedMakautData)
      .eq('user_id', userId)
      .select('*')
      .single());
  } else {
    // Insert new
    ({ data, error } = await supabase
      .from('student_profiles')
      .insert(mockedMakautData)
      .select('*')
      .single());
  }

  if (error) {
    console.error('[makaut.service] Error saving makaut profile:', error);
    throw new Error('Failed to save MAKAUT profile to database.');
  }

  return data as StudentProfile;
}
