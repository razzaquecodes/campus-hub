import { supabase } from '@/lib/supabase';

export interface StudentStats {
  cgpa: number | null;
  attendance_pct: number | null;
  total_classes: number;
  attended_classes: number;
  semester_progress: number;
}

const DEFAULT_STATS: StudentStats = {
  cgpa: null,
  attendance_pct: null,
  total_classes: 0,
  attended_classes: 0,
  semester_progress: 0,
};

export async function fetchStudentStats(userId: string): Promise<StudentStats> {
  if (!supabase) return DEFAULT_STATS;

  const { data, error } = await supabase
    .from('student_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return DEFAULT_STATS;

  return {
    cgpa: data.cgpa ? Number(data.cgpa) : null,
    attendance_pct: data.attendance_pct ? Number(data.attendance_pct) : null,
    total_classes: data.total_classes ?? 0,
    attended_classes: data.attended_classes ?? 0,
    semester_progress: data.semester_progress ? Number(data.semester_progress) : 0,
  };
}

export async function upsertStudentStats(
  userId: string,
  stats: Partial<StudentStats>,
): Promise<void> {
  if (!supabase) return;
  await supabase.from('student_stats').upsert({
    user_id: userId,
    ...stats,
    last_updated: new Date().toISOString(),
  });
}
