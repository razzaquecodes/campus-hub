export interface InternalMark {
  semester: string;
  subjectCode: string;
  subjectName: string;
  caMarks: string | number | null;
  pcaMarks: string | number | null;
  total?: string | number | null;
  totalMarks?: string | number | null;
}

export interface InternalMarksResponse {
  success: boolean;
  semesters: any[];
}
