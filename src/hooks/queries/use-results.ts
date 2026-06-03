import { useQuery } from '@tanstack/react-query';
import { API_CONFIG } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import { useStudentStore } from '@/store/student.store';

export const resultsKeys = {
  all: ['results'] as const,
  detail: (rollNumber?: string) => [...resultsKeys.all, rollNumber] as const,
};

export interface SubjectResult {
  subjectCode: string;
  subjectName: string;
  credit: number;
  grade: string;
  semester: number;
}

export interface SemesterResult {
  semester: number;
  sgpa: number | null;
  cgpa: number | null;
  subjects: SubjectResult[];
  status: 'Published' | 'Processing';
}

interface ResultsApiResponse {
  success: boolean;
  semesters: {
    semester: string | number;
    sgpa: string | number | null;
    cgpa: string | number | null;
    subjects: {
      subjectCode?: string;
      code?: string;
      subjectName?: string;
      name?: string;
      credit?: string | number;
      credits?: string | number;
      grade?: string;
    }[];
  }[];
}

async function fetchResults(rollNumber: string): Promise<SemesterResult[]> {
  const url = `${API_CONFIG.BASE_URL}/student/${rollNumber}/results`;
  
  console.log("ROLL =", rollNumber);
  console.log("BASE URL =", API_CONFIG.BASE_URL);
  console.log("FULL URL =", url);
  
  const json = await apiClient.get<ResultsApiResponse>(url);

  if (json && json.success && Array.isArray(json.semesters)) {
    const mapped = json.semesters.map((semObj) => {
      const subs = Array.isArray(semObj.subjects) ? semObj.subjects : [];
      const parsedSubs = subs.map((sub) => ({
        subjectCode: sub.subjectCode || sub.code || 'Unknown',
        subjectName: sub.subjectName || sub.name || 'Unknown',
        credit: Number(sub.credit !== undefined ? sub.credit : sub.credits) || 0,
        grade: sub.grade || 'N/A',
        semester: parseInt(String(semObj.semester), 10) || 0,
      }));

      let parsedSgpa = null;
      if (semObj.sgpa !== null && semObj.sgpa !== undefined && semObj.sgpa !== 'null' && semObj.sgpa !== 'N/A') {
        const num = parseFloat(String(semObj.sgpa));
        if (!isNaN(num) && num > 0) parsedSgpa = num;
      }

      let parsedCgpa = null;
      if (semObj.cgpa !== null && semObj.cgpa !== undefined && semObj.cgpa !== 'null' && semObj.cgpa !== 'N/A') {
        const num = parseFloat(String(semObj.cgpa));
        if (!isNaN(num) && num > 0) parsedCgpa = num;
      }

      return {
        semester: parseInt(String(semObj.semester), 10) || 0,
        sgpa: parsedSgpa,
        cgpa: parsedCgpa,
        subjects: parsedSubs,
        status: parsedSgpa !== null ? ('Published' as const) : ('Processing' as const),
      };
    });
    
    // Sort descending
    mapped.sort((a, b) => b.semester - a.semester);
    return mapped;
  }
  
  return [];
}

export function useResults() {
  const student = useStudentStore((s) => s.student);
  const rollNumber = student?.rollNumber;

  return useQuery({
    queryKey: resultsKeys.detail(rollNumber),
    enabled: !!rollNumber,
    queryFn: () => fetchResults(rollNumber!),
    // Cache for 24 hours since results rarely change
    staleTime: 1000 * 60 * 60 * 24, 
  });
}
