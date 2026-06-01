export interface CAMark {
  semester: string;
  subjectCode: string;
  subjectName: string;
  caMarks: string | number;
  pcaMarks: string | number;
  total?: string | number;
  totalMarks?: string | number;
}

export interface CAMarksResponse {
  success: boolean;
  data: CAMark[];
}
