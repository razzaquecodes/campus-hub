-- CampusHub — scalable MAKAUT university schema
-- Run in Supabase SQL Editor or via CLI

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Branches (CSE, ECE, etc.)
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  college_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Semesters
CREATE TABLE IF NOT EXISTS semesters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INT NOT NULL CHECK (number BETWEEN 1 AND 8),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  UNIQUE (branch_id, number, academic_year)
);

-- Sections (A, B, C)
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
  UNIQUE (semester_id, code)
);

-- Student Profiles
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  roll_number TEXT,
  registration_number TEXT,
  email TEXT NOT NULL,
  mobile TEXT,
  institute_name TEXT,
  course_name TEXT,
  abc_id TEXT,
  photo_url TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Faculty
CREATE TABLE IF NOT EXISTS faculty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES student_profiles(user_id),
  full_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  department TEXT NOT NULL,
  branch_id UUID REFERENCES branches(id),
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  bio TEXT,
  achievements JSONB DEFAULT '[]',
  is_hod BOOLEAN DEFAULT FALSE,
  is_principal BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES faculty(id),
  credits INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (code, semester_id)
);

-- Schedules
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_by UUID REFERENCES student_profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES student_profiles(user_id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by UUID REFERENCES student_profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, subject_id, date)
);

-- Events (exams, holidays, classes)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('exam', 'holiday', 'class', 'fest', 'other')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  branch_id UUID REFERENCES branches(id),
  semester_id UUID REFERENCES semesters(id),
  section_id UUID REFERENCES sections(id),
  subject_id UUID REFERENCES subjects(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  author_id UUID REFERENCES student_profiles(user_id) NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('college', 'branch', 'semester', 'section', 'subject')),
  branch_id UUID REFERENCES branches(id),
  semester_id UUID REFERENCES semesters(id),
  section_id UUID REFERENCES sections(id),
  subject_id UUID REFERENCES subjects(id),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_pinned BOOLEAN DEFAULT FALSE,
  attachments JSONB DEFAULT '[]',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcement read receipts
CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES student_profiles(user_id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (announcement_id, user_id)
);

-- Notices (official college notices)
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  published_by UUID REFERENCES student_profiles(user_id),
  is_official BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resources (notes, uploads)
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT,
  resource_type TEXT DEFAULT 'notes' CHECK (resource_type IN ('notes', 'slides', 'assignment', 'link', 'video')),
  uploaded_by UUID REFERENCES student_profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chats (future-ready)
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  chat_type TEXT DEFAULT 'section' CHECK (chat_type IN ('direct', 'section', 'subject', 'announcement')),
  section_id UUID REFERENCES sections(id),
  subject_id UUID REFERENCES subjects(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for scale
CREATE INDEX IF NOT EXISTS idx_announcements_scope ON announcements(scope, branch_id, semester_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subject ON assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(starts_at);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(user_id, date);

-- RLS (enable in production)
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Example policy: students read scoped announcements
-- CREATE POLICY "Students read scoped announcements" ON announcements FOR SELECT
--   USING (auth.uid() IS NOT NULL);
