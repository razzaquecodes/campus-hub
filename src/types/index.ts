export type {
  Announcement,
  Assignment,
  Branch,
  CalendarEvent,
  FacultyMember,
  ScheduleSlot,
  Section,
  Semester,
  Subject,
  UserProfile,
} from './database';

export type {
  StudentModel,
  StudentProfileInsert,
  VerifyStudentErrorResponse,
  VerifyStudentResponse,
} from './student';

export type {
  AcademicYear,
  AudienceEstimate,
  AudienceTarget,
  BranchCode,
  SectionCode,
  TargetableModule,
  TargetableProfile,
} from './targeting';

export type {
  StudentMasterProfile,
  ProfileVerificationStatus,
} from './profile';

export type {
  AttendanceAuditLog,
  AttendanceCaptureStep,
  AttendanceSession,
  AttendanceSessionStatus,
  AttendanceSubmission,
  AttendanceSubmissionStatus,
  AttendanceVerificationStatus,
  CreateAttendanceSessionInput,
  StudentAttendanceDraft,
  SubmitAttendanceInput,
  VerificationMethod,
} from './attendance';

export type {
  AnnouncementCategory,
  AnnouncementPriority,
  AnnouncementStatus,
  CampusAnnouncement,
  CreateAnnouncementInput,
} from './announcement';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Holiday {
  id: string;
  title: string;
  date: string;
  type: 'holiday' | 'exam' | 'event';
  description?: string;
}
