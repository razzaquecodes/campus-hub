-- Migration 004: Create faculty table if it doesn't exist
-- This ensures faculty authentication works

-- Create faculty table
CREATE TABLE IF NOT EXISTS faculty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  full_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  department TEXT NOT NULL,
  branch_id UUID,
  email TEXT UNIQUE,
  phone TEXT,
  photo_url TEXT,
  bio TEXT,
  achievements JSONB DEFAULT '[]',
  is_hod BOOLEAN DEFAULT FALSE,
  is_principal BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read faculty
DROP POLICY IF EXISTS "auth_read_faculty";
CREATE POLICY "auth_read_faculty" ON faculty FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create policy for service role to insert/update
DROP POLICY IF EXISTS "service_role_faculty_insert";
CREATE POLICY "service_role_faculty_insert" ON faculty FOR INSERT WITH CHECK (true);

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_faculty_email ON faculty(email);

-- Create index on department
CREATE INDEX IF NOT EXISTS idx_faculty_department ON faculty(department);

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON faculty TO authenticated;
GRANT ALL ON faculty TO service_role;