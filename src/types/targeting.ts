export const BRANCH_CODES = ['CSE', 'CE', 'ME', 'EE', 'ECE'] as const;
export const ACADEMIC_YEARS = [1, 2, 3, 4] as const;
export const SECTION_CODES = ['A', 'B', 'C', 'D'] as const;

export type BranchCode = (typeof BRANCH_CODES)[number];
export type AcademicYear = (typeof ACADEMIC_YEARS)[number];
export type SectionCode = (typeof SECTION_CODES)[number];

export type TargetableModule =
  | 'announcements'
  | 'attendance'
  | 'assignments'
  | 'resources'
  | 'leave-management';

export interface AudienceTarget {
  branch?: BranchCode;
  year?: AcademicYear;
  section?: SectionCode;
  allBranches?: boolean;
  allYears?: boolean;
  allSections?: boolean;
  entireCollege?: boolean;
}

export interface TargetableProfile {
  branch?: BranchCode | string | null;
  year?: AcademicYear | number | string | null;
  section?: SectionCode | string | null;
}

export interface AudienceEstimate {
  label: string;
  estimatedCount: number;
  target: AudienceTarget;
}
