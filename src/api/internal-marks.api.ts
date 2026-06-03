import { API_CONFIG } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type { InternalMark } from '@/types/internal-marks';

interface InternalMarksRawResponse {
  success: boolean;
  message?: string;
  semesters: {
    semester?: string | number;
    semesterNumber?: string | number;
    subjects?: {
      subjectCode: string;
      subjectName: string;
      ca1?: number | null;
      ca2?: number | null;
      ca3?: number | null;
      ca4?: number | null;
      pca1?: number | null;
      pca2?: number | null;
      pa1?: number | null;
      pa2?: number | null;
      semester?: string | number;
    }[];
  }[] | any[];
}

export async function fetchInternalMarks(rollNumber: string): Promise<InternalMark[]> {
  const baseUrl = API_CONFIG.BASE_URL;
  const url = `${baseUrl}/student/${rollNumber}/ca-marks`;
  
  const json = await apiClient.get<InternalMarksRawResponse>(url);
  
  if (json.success === false) {
    throw new Error(json.message || 'Failed to fetch Internal marks');
  }

  const semesters = json.semesters || [];
  let flatMarks: InternalMark[] = [];

  if (Array.isArray(semesters)) {
    if (semesters.length > 0 && semesters[0].subjects) {
      semesters.forEach((sem) => {
        const semsSubjects = sem.subjects || [];
        semsSubjects.forEach((sub: any) => {
          flatMarks.push({
            subjectCode: sub.subjectCode,
            subjectName: sub.subjectName,
            ca1: sub.ca1 !== null && sub.ca1 !== undefined ? sub.ca1 : null,
            ca2: sub.ca2 !== null && sub.ca2 !== undefined ? sub.ca2 : null,
            ca3: sub.ca3 !== null && sub.ca3 !== undefined ? sub.ca3 : null,
            ca4: sub.ca4 !== null && sub.ca4 !== undefined ? sub.ca4 : null,
            pca1: sub.pca1 ?? sub.pa1 ?? null,
            pca2: sub.pca2 ?? sub.pa2 ?? null,
            semester: String(sem.semester || sem.semesterNumber || sub.semester || '0'),
          });
        });
      });
    } else {
      flatMarks = semesters as InternalMark[];
    }
  }

  return flatMarks;
}
