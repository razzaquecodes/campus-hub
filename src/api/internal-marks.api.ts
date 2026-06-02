import { Env } from '@/lib/env';
import type { InternalMark } from '@/types/internal-marks';

export async function fetchInternalMarks(rollNumber: string): Promise<InternalMark[]> {
  console.log("ROLL NUMBER", rollNumber);
  const baseUrl = (Env.makautVerifyUrl || '').replace(/\/$/, '');
  const url = `${baseUrl}/student/${rollNumber}/ca-marks`;
  
  console.log("INTERNAL MARKS REQUEST URL", url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log("INTERNAL MARKS RESPONSE STATUS", response.status);

  if (!response.ok) {
    throw new Error('Failed to fetch Internal marks');
  }

  const json = (await response.json()) as any;
  
  if (json.success === false) {
    throw new Error(json.message || 'Failed to fetch Internal marks');
  }

  const semesters = json.semesters || [];
  let flatMarks: any[] = [];

  if (Array.isArray(semesters)) {
    if (semesters.length > 0 && semesters[0].subjects) {
      semesters.forEach((sem: any) => {
        const semsSubjects = sem.subjects || [];
        semsSubjects.forEach((sub: any) => {
          flatMarks.push({
            ...sub,
            semester: sem.semester || sem.semesterNumber || sub.semester
          });
        });
      });
    } else {
      flatMarks = semesters;
    }
  }

  return flatMarks as InternalMark[];
}
