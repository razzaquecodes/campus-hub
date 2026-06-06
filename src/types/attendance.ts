import type { AudienceTarget, BranchCode, AcademicYear, SectionCode } from '@/types/targeting';

export type VerificationMethod = 'FACE' | 'OCR' | 'BLE' | 'GPS' | 'MANUAL';
export type AttendanceSessionStatus = 'scheduled' | 'active' | 'closed' | 'expired';
export type AttendanceSubmissionStatus = 'present' | 'late' | 'absent';
export type AttendanceVerificationStatus = 'pending' | 'verified' | 'rejected';
export type AttendanceCaptureStep = 'available' | 'selfie' | 'board' | 'submit' | 'submitted';

export interface AttendanceSession {
  id: string;
  faculty_id: string;
  subject: string;
  subject_code?: string | null;
  branch?: BranchCode | null;
  year?: AcademicYear | null;
  section?: SectionCode | null;
  target: AudienceTarget;
  session_code: string;
  status: AttendanceSessionStatus;
  required_methods: VerificationMethod[];
  board_image_url?: string | null;
  start_time: string;
  end_time?: string | null;
  expires_at?: string | null;
  live_count: number;
  created_at: string;
  updated_at?: string | null;
}

export interface AttendanceSubmission {
  id: string;
  session_id: string;
  student_id: string;
  student_roll: string;
  student_name?: string | null;
  selfie_url?: string | null;
  board_image_url?: string | null;
  status: AttendanceSubmissionStatus;
  verification_status: AttendanceVerificationStatus;
  verified_methods: VerificationMethod[];
  fraud_score?: number | null;
  submitted_at: string;
  created_at?: string | null;
}

export interface AttendanceAuditLog {
  id: string;
  session_id: string;
  submission_id?: string | null;
  actor_id: string;
  actor_role: 'student' | 'faculty' | 'system';
  action:
    | 'session.created'
    | 'session.closed'
    | 'submission.created'
    | 'submission.verified'
    | 'submission.rejected'
    | 'audit.note';
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreateAttendanceSessionInput {
  facultyId: string;
  subject: string;
  subjectCode?: string;
  target: AudienceTarget;
  requiredMethods?: VerificationMethod[];
  boardImageUrl?: string;
  durationMinutes?: number;
}

export interface SubmitAttendanceInput {
  sessionId: string;
  studentId: string;
  studentRoll: string;
  studentName?: string;
  selfieUrl: string;
  boardImageUrl: string;
  verifiedMethods?: VerificationMethod[];
}

export interface StudentAttendanceDraft {
  sessionId: string;
  step: AttendanceCaptureStep;
  selfieUri?: string;
  boardUri?: string;
  updatedAt: string;
}
