import { Env } from '@/lib/env';
import type { CAMark, CAMarksResponse } from '@/types/ca-marks';

export async function fetchCAMarks(rollNumber: string): Promise<CAMark[]> {
  console.log("ROLL NUMBER", rollNumber);
  const baseUrl = (Env.makautVerifyUrl || '').replace(/\/$/, '');
  const url = `${baseUrl}/student/${rollNumber}/ca-marks`;
  
  console.log("CA MARKS REQUEST URL", url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log("CA MARKS RESPONSE STATUS", response.status);

  if (!response.ok) {
    throw new Error('Failed to fetch CA marks');
  }

  const json = (await response.json()) as any;
  console.log("CA MARKS RAW RESPONSE", json);
  console.log("CA MARKS SEMESTERS", json.semesters);
  
  if (json.success === false) {
    throw new Error(json.message || 'Failed to fetch CA marks');
  }

  const semesters = json.semesters || [];
  console.log("CA MARKS SEMESTERS LENGTH", semesters.length);
  
  let flatMarks: any[] = [];
  let totalSubjects = 0;

  if (Array.isArray(semesters)) {
    if (semesters.length > 0 && semesters[0].subjects) {
      // It's a nested structure: [{ semester: '4', subjects: [...] }]
      semesters.forEach((sem: any) => {
        const semsSubjects = sem.subjects || [];
        totalSubjects += semsSubjects.length;
        semsSubjects.forEach((sub: any) => {
          flatMarks.push({
            ...sub,
            semester: sem.semester || sem.semesterNumber || sub.semester
          });
        });
      });
    } else {
      // It's a flat structure
      flatMarks = semesters;
      totalSubjects = flatMarks.length;
    }
  }

  console.log("CA MARKS TOTAL SUBJECTS COUNT", totalSubjects);

  return flatMarks as CAMark[];
}
