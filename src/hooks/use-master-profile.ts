import { useMemo } from 'react';

import { resolveMasterProfile } from '@/services/profile.service';
import { useAuthStore } from '@/store/auth.store';
import { useStudentStore } from '@/store/student.store';
import { useResults } from '@/hooks/queries/use-results';

export function useMasterProfile() {
  const student = useStudentStore((s) => s.student);
  const profile = useAuthStore((s) => s.profile);

  const { data: results } = useResults();

  return useMemo(() => {
    const baseProfile = resolveMasterProfile(student, profile);
    if (!baseProfile) return null;

    let currentSemester = baseProfile.semester;
    
    if (results && results.length > 0) {
      const publishedSemesters = results
        .filter(r => r.status === 'Published')
        .map(r => r.semester);
        
      if (publishedSemesters.length > 0) {
        const highestPublished = Math.max(...publishedSemesters);
        currentSemester = Math.min(8, highestPublished + 1);
      }
    }

    const currentYear = Math.min(Math.max(Math.ceil(currentSemester / 2), 1), 4);

    return {
      ...baseProfile,
      semester: currentSemester,
      year: currentYear
    };
  }, [student, profile, results]);
}
