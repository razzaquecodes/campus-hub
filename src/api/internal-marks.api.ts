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
  console.log("RAW API", json);
  
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
          console.log("SUBJECT", sub);
          flatMarks.push({
            ...sub,
            ca1: sub.ca1 !== null && sub.ca1 !== undefined ? sub.ca1 : null,
            ca2: sub.ca2 !== null && sub.ca2 !== undefined ? sub.ca2 : null,
            ca3: sub.ca3 !== null && sub.ca3 !== undefined ? sub.ca3 : null,
            ca4: sub.ca4 !== null && sub.ca4 !== undefined ? sub.ca4 : null,
            pca1: sub.pca1 ?? sub.pa1 ?? null,
            pca2: sub.pca2 ?? sub.pa2 ?? null,
            semester: sem.semester || sem.semesterNumber || sub.semester
          });
        });
      });
    } else {
      console.log("RAW API (flat)", semesters);
      flatMarks = semesters;
    }
  }

  return flatMarks as InternalMark[];
}
