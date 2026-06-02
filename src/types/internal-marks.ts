export interface InternalMark {
  semester: string;
  subjectCode: string;
  subjectName: string;
  teacher?: string | null;
  ca1: number | null;
  ca2: number | null;
  ca3: number | null;
  ca4: number | null;
  pca1: number | null;
  pca2: number | null;
}

export interface InternalMarksResponse {
  success: boolean;
  semesters: any[];
}
