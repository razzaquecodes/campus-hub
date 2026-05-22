import type { UserRole } from '@/constants/theme';

export interface Branch {
  id: string;
  code: string;
  name: string;
}

export interface Semester {
  id: string;
  number: number;
  branch_id: string;
  academic_year: string;
}

export interface Section {
  id: string;
  code: string;
  semester_id: string;
}

export interface UserProfile {
  id: string;
  roll_number: string;
  email: string;
  full_name: string;
  role: UserRole;
  branch_id: string | null;
  semester_id: string | null;
  section_id: string | null;
  branch?: Branch | null;
  semester?: Semester | null;
  section?: Section | null;
  college: string;
  avatar_url?: string | null;
  is_verified: boolean;
}

export interface FacultyMember {
  id: string;
  full_name: string;
  designation: string;
  department: string;
  email?: string | null;
  phone?: string | null;
  photo_url?: string | null;
  bio?: string | null;
  achievements: string[];
  is_hod: boolean;
  is_principal: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  author_id: string;
  author_name?: string;
  scope: 'college' | 'branch' | 'semester' | 'section' | 'subject';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_pinned: boolean;
  created_at: string;
  read?: boolean;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  faculty_name?: string;
  attendance_percent?: number;
}

export interface Assignment {
  id: string;
  title: string;
  subject_id: string;
  subject_name: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completed: boolean;
  progress: number;
}

export interface ScheduleSlot {
  id: string;
  subject_name: string;
  subject_code: string;
  start_time: string;
  end_time: string;
  room: string;
  day_of_week: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  event_type: 'exam' | 'holiday' | 'class' | 'fest' | 'other';
  starts_at: string;
  description?: string;
}

export interface MakautCredentials {
  identifier: string;
  password: string;
}

export interface MakautVerifiedProfile {
  roll_number: string;
  email: string;
  full_name: string;
  branch_code: string;
  branch_name: string;
  semester: number;
  section: string;
  college: string;
  department: string;
}
