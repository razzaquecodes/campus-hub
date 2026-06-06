import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  mapStudentToMasterProfile,
  mapUserProfileToMasterProfile,
  type StudentMasterProfile,
} from '@/types/profile';
import type { StudentModel } from '@/types/student';
import type { UserProfile } from '@/types/database';

export function resolveMasterProfile(
  student?: StudentModel | null,
  profile?: UserProfile | null,
): StudentMasterProfile | null {
  if (student) return mapStudentToMasterProfile(student, profile);
  if (profile) return mapUserProfileToMasterProfile(profile);
  return null;
}

export async function upsertMasterProfile(profile: StudentMasterProfile): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  await supabase.from('student_profiles').upsert(
    {
      user_id: profile.id,
      roll_number: profile.rollNumber,
      registration_number: profile.registrationNumber,
      full_name: profile.fullName,
      email: profile.email ?? null,
      mobile: profile.mobile ?? null,
      institute_name: profile.institute,
      course_name: profile.courseName ?? profile.branch,
      photo_url: profile.profilePhoto,
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: 'roll_number' },
  );
}
