import type { UserRole } from '@/types/supabase';

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
  branch_id?: string | null;
  semester_id?: string | null;
  section_id?: string | null;
  branch?: string | null;
  semester?: string | null;
  section?: string | null;
  year?: string | null;
  batch?: string | null;
  advisor?: string | null;
  phone?: string | null;
  hostel_block?: string | null;
  hostel_room?: string | null;
  college: string;
  avatar_url?: string | null;
  is_verified: boolean;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  full_name: string;
  roll_number: string;
  registration_number?: string | null;
  email?: string | null;
  mobile?: string | null;
  institute_name?: string | null;
  course_name?: string | null;
  abc_id?: string | null;
  photo_url?: string | null;
  last_synced_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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

