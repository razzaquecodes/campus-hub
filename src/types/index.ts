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

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Holiday {
  id: string;
  title: string;
  date: string;
  type: 'holiday' | 'exam' | 'event';
  description?: string;
}
