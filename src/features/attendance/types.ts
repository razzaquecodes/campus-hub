export interface SubjectAttendanceRecord {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  attended: number;
  total: number;
  monthlyTrend: number[];
}

export interface AttendanceDashboard {
  overallPercent: number;
  totalAttended: number;
  totalClasses: number;
  subjects: SubjectAttendanceRecord[];
  monthlyOverview: { month: string; percent: number }[];
  atRiskCount: number;
}
