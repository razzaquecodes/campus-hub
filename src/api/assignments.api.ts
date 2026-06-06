import { supabase } from '@/lib/supabase';
import type { Assignment } from '@/types/database';

export interface AssignmentWithStatus extends Assignment {
  ua_id?: string; // user_assignments.id
}

/**
 * Fetch assignments for the given semester, joined with user completion status.
 */
export async function fetchAssignmentsForUser(
  userId: string,
  semesterId?: string | null,
): Promise<AssignmentWithStatus[]> {
  if (!supabase) return [];

  // Fetch assignments for semester
  let query = supabase
    .from('assignments')
    .select(`
      id,
      title,
      description,
      due_date,
      priority,
      subject_id,
      subjects(name, code),
      user_assignments!left(id, completed, progress, completed_at)
    `)
    .filter('user_assignments.user_id', 'eq', userId)
    .order('due_date', { ascending: true })
    .limit(30);

  if (semesterId) {
    query = query.filter('subjects.semester_id', 'eq', semesterId);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((row: any) => {
    const ua = Array.isArray(row.user_assignments) ? row.user_assignments[0] : row.user_assignments;
    const subject = Array.isArray(row.subjects) ? row.subjects[0] : row.subjects;
    return {
      id: row.id,
      title: row.title,
      subject_id: row.subject_id,
      subject_name: subject?.name ?? 'Unknown',
      due_date: row.due_date,
      priority: row.priority ?? 'medium',
      completed: ua?.completed ?? false,
      progress: ua?.progress ?? 0,
      ua_id: ua?.id,
    };
  });
}

/**
 * Toggle assignment completion for a user (upsert user_assignments row).
 */
export async function toggleAssignmentCompletion(
  userId: string,
  assignmentId: string,
  completed: boolean,
): Promise<void> {
  if (!supabase) return;
  await supabase.from('user_assignments').upsert({
    user_id: userId,
    assignment_id: assignmentId,
    completed,
    progress: completed ? 100 : 0,
    completed_at: completed ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  });
}
