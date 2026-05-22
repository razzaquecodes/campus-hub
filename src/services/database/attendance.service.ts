import { MOCK_ATTENDANCE_DASHBOARD } from '@/constants/attendance-mock';
import type { AttendanceDashboard, SubjectAttendanceRecord } from '@/features/attendance/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getAttendancePercent } from '@/utils/attendance';
import type { UserProfile } from '@/types/database';

export async function fetchAttendanceDashboard(
  profile: UserProfile,
): Promise<AttendanceDashboard> {
  if (!isSupabaseConfigured || !supabase || !profile.semester_id) {
    return MOCK_ATTENDANCE_DASHBOARD;
  }

  try {
    const { data: subjects, error: subErr } = await supabase
      .from('subjects')
      .select('id, code, name, faculty_id')
      .eq('semester_id', profile.semester_id);

    if (subErr || !subjects?.length) return MOCK_ATTENDANCE_DASHBOARD;

    const subjectIds = subjects.map((s) => s.id);
    const { data: records, error: attErr } = await supabase
      .from('attendance')
      .select('subject_id, status')
      .eq('user_id', profile.id)
      .in('subject_id', subjectIds);

    if (attErr) return MOCK_ATTENDANCE_DASHBOARD;

    const bySubject = new Map<string, { attended: number; total: number }>();
    for (const id of subjectIds) {
      bySubject.set(id, { attended: 0, total: 0 });
    }

    for (const row of records ?? []) {
      const bucket = bySubject.get(row.subject_id);
      if (!bucket) continue;
      bucket.total += 1;
      if (row.status === 'present' || row.status === 'late') bucket.attended += 1;
    }

    const subjectRecords: SubjectAttendanceRecord[] = subjects.map((s) => {
      const stats = bySubject.get(s.id) ?? { attended: 0, total: 0 };
      return {
        subjectId: s.id,
        subjectCode: s.code,
        subjectName: s.name,
        facultyName: 'Faculty',
        attended: stats.attended,
        total: stats.total,
        monthlyTrend: [],
      };
    });

    const totalAttended = subjectRecords.reduce((a, s) => a + s.attended, 0);
    const totalClasses = subjectRecords.reduce((a, s) => a + s.total, 0);
    const overallPercent = getAttendancePercent(totalAttended, totalClasses);

    return {
      overallPercent,
      totalAttended,
      totalClasses,
      subjects: subjectRecords,
      monthlyOverview: MOCK_ATTENDANCE_DASHBOARD.monthlyOverview,
      atRiskCount: subjectRecords.filter(
        (s) => getAttendancePercent(s.attended, s.total) < 75,
      ).length,
    };
  } catch {
    return MOCK_ATTENDANCE_DASHBOARD;
  }
}
