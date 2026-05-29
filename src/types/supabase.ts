/** Supabase database types — align with supabase/migrations/*.sql */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'admin' | 'teacher' | 'class_rep' | 'student';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type AnnouncementScope = 'college' | 'branch' | 'semester' | 'section' | 'subject';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Database {
  public: {
    Tables: {
      student_profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          roll_number: string | null;
          registration_number: string | null;
          email: string;
          mobile: string | null;
          institute_name: string | null;
          course_name: string | null;
          abc_id: string | null;
          photo_url: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['student_profiles']['Row']> & {
          user_id: string;
          full_name: string;
          email: string;
        };
        Update: Partial<Database['public']['Tables']['student_profiles']['Row']>;
      };
      branches: {
        Row: { id: string; code: string; name: string; college_id: string | null; created_at: string };
        Insert: { code: string; name: string };
        Update: Partial<Database['public']['Tables']['branches']['Insert']>;
      };
      semesters: {
        Row: {
          id: string;
          number: number;
          branch_id: string;
          academic_year: string;
        };
        Insert: { number: number; branch_id: string; academic_year: string };
        Update: Partial<Database['public']['Tables']['semesters']['Insert']>;
      };
      sections: {
        Row: { id: string; code: string; semester_id: string };
        Insert: { code: string; semester_id: string };
        Update: Partial<Database['public']['Tables']['sections']['Insert']>;
      };
      subjects: {
        Row: {
          id: string;
          code: string;
          name: string;
          semester_id: string;
          faculty_id: string | null;
          credits: number;
          created_at: string;
        };
        Insert: {
          code: string;
          name: string;
          semester_id: string;
          credits?: number;
        };
        Update: Partial<Database['public']['Tables']['subjects']['Insert']>;
      };
      faculty: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string;
          designation: string;
          department: string;
          branch_id: string | null;
          email: string | null;
          phone: string | null;
          photo_url: string | null;
          bio: string | null;
          achievements: Json;
          is_hod: boolean;
          is_principal: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          full_name: string;
          designation: string;
          department: string;
        };
        Update: Partial<Database['public']['Tables']['faculty']['Insert']>;
      };
      attendance: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string;
          date: string;
          status: AttendanceStatus;
          marked_by: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          subject_id: string;
          date: string;
          status: AttendanceStatus;
        };
        Update: Partial<Database['public']['Tables']['attendance']['Insert']>;
      };
      assignments: {
        Row: {
          id: string;
          subject_id: string;
          title: string;
          description: string | null;
          due_date: string;
          priority: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          subject_id: string;
          title: string;
          due_date: string;
        };
        Update: Partial<Database['public']['Tables']['assignments']['Insert']>;
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          body: string;
          author_id: string;
          scope: AnnouncementScope;
          branch_id: string | null;
          semester_id: string | null;
          section_id: string | null;
          subject_id: string | null;
          priority: AnnouncementPriority;
          is_pinned: boolean;
          attachments: Json;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          title: string;
          body: string;
          author_id: string;
          scope: AnnouncementScope;
        };
        Update: Partial<Database['public']['Tables']['announcements']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          event_type: string;
          starts_at: string;
          ends_at: string | null;
          branch_id: string | null;
          semester_id: string | null;
          section_id: string | null;
          subject_id: string | null;
          created_at: string;
        };
        Insert: {
          title: string;
          event_type: string;
          starts_at: string;
        };
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      exams: {
        Row: {
          id: string;
          title: string;
          subject_id: string | null;
          semester_id: string | null;
          starts_at: string;
          duration_minutes: number;
          room: string | null;
          created_at: string;
        };
        Insert: {
          title: string;
          starts_at: string;
        };
        Update: Partial<Database['public']['Tables']['exams']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          data: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          body: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      schedules: {
        Row: {
          id: string;
          subject_id: string;
          section_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          room: string | null;
          created_at: string;
        };
        Insert: {
          subject_id: string;
          section_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
        };
        Update: Partial<Database['public']['Tables']['schedules']['Insert']>;
      };
      resources: {
        Row: {
          id: string;
          subject_id: string;
          title: string;
          file_url: string | null;
          resource_type: string;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: { subject_id: string; title: string };
        Update: Partial<Database['public']['Tables']['resources']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
