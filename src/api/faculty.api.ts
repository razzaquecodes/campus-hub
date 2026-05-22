import { MOCK_FACULTY } from '@/constants/mock-data';
import { isSupabaseConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { FacultyMember } from '@/types/database';

export async function fetchFaculty(department?: string): Promise<FacultyMember[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('faculty').select('*').order('sort_order');
    if (department) query = query.eq('department', department);
    const { data, error } = await query;
    if (!error && data) {
      return data.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        full_name: row.full_name as string,
        designation: row.designation as string,
        department: row.department as string,
        email: row.email as string | null,
        phone: row.phone as string | null,
        photo_url: row.photo_url as string | null,
        bio: row.bio as string | null,
        achievements: (row.achievements as string[]) ?? [],
        is_hod: row.is_hod as boolean,
        is_principal: row.is_principal as boolean,
      }));
    }
  }

  return department
    ? MOCK_FACULTY.filter((f) => f.department === department)
    : MOCK_FACULTY;
}
