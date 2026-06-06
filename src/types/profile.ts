import type { AcademicYear, BranchCode, SectionCode } from '@/types/targeting';
import type { StudentModel } from '@/types/student';
import type { UserProfile } from '@/types/database';

export type ProfileVerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'FAILED';

export interface StudentMasterProfile {
  id: string;
  rollNumber: string;
  registrationNumber: string;
  fullName: string;
  branch: BranchCode;
  year: AcademicYear;
  semester: number;
  section: SectionCode;
  institute: string;
  profilePhoto: string | null;
  verificationStatus: ProfileVerificationStatus;
  courseName?: string;
  email?: string;
  mobile?: string;
  lastSyncedAt?: string;
}

export type StudentProfile = StudentMasterProfile;

function extractBranch(value?: string | null): BranchCode {
  const normalized = (value ?? '').toUpperCase();
  if (normalized.includes('CIVIL') || normalized.includes(' CE')) return 'CE';
  if (normalized.includes('MECHANICAL') || normalized.includes(' ME')) return 'ME';
  if (normalized.includes('ELECTRONICS') || normalized.includes('ECE')) return 'ECE';
  if (normalized.includes('ELECTRICAL') || normalized.includes(' EE')) return 'EE';
  return 'CSE';
}

function normalizeSemester(value?: string | number | null): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, 8);
}

function semesterToYear(semester: number): AcademicYear {
  return Math.min(Math.max(Math.ceil(semester / 2), 1), 4) as AcademicYear;
}

function normalizeSection(value?: string | null): SectionCode {
  const section = (value ?? 'A').toUpperCase().slice(0, 1);
  return section === 'B' || section === 'C' || section === 'D' ? section : 'A';
}

export function mapStudentToMasterProfile(
  student: StudentModel,
  profile?: UserProfile | null,
): StudentMasterProfile {
  const semester = normalizeSemester(profile?.semester ?? null);

  return {
    id: profile?.id ?? `makaut_${student.rollNumber}`,
    rollNumber: student.rollNumber,
    registrationNumber: student.registrationNumber,
    fullName: student.fullName,
    branch: extractBranch(profile?.branch ?? student.courseName),
    year: semesterToYear(semester),
    semester,
    section: normalizeSection(profile?.section),
    institute: student.instituteName,
    profilePhoto: profile?.avatar_url ?? student.profilePhotoUrl ?? null,
    verificationStatus: student.verified ? 'VERIFIED' : 'UNVERIFIED',
    courseName: student.courseName,
    email: student.email,
    mobile: student.mobile,
    lastSyncedAt: student.createdAt,
  };
}

export function mapUserProfileToMasterProfile(profile: UserProfile): StudentMasterProfile {
  const semester = normalizeSemester(profile.semester ?? null);

  return {
    id: profile.id,
    rollNumber: profile.roll_number,
    registrationNumber: '—',
    fullName: profile.full_name,
    branch: extractBranch(profile.branch),
    year: semesterToYear(semester),
    semester,
    section: normalizeSection(profile.section),
    institute: profile.college,
    profilePhoto: profile.avatar_url ?? null,
    verificationStatus: profile.is_verified ? 'VERIFIED' : 'UNVERIFIED',
    email: profile.email,
    mobile: profile.phone ?? undefined,
  };
}
