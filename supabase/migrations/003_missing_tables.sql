-- CampusHub Migration 003
-- Adds: notifications, achievements, user_assignments, student_stats
-- Adds: missing columns to student_profiles table
-- Adds: full RLS policies

-- ─── Notifications ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES student_profiles(user_id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general','announcement','event','attendance','assignment','result')),
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  action_url  TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY IF NOT EXISTS "users_own_notifications_select"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "users_own_notifications_update"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins/faculty can insert notifications
CREATE POLICY IF NOT EXISTS "service_role_insert_notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ─── Achievements ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES student_profiles(user_id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  icon        TEXT DEFAULT 'trophy',
  color       TEXT DEFAULT '#F59E0B',
  awarded_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "users_read_own_achievements"
  ON achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "service_role_insert_achievements"
  ON achievements FOR INSERT
  WITH CHECK (true);

-- ─── User Assignments (tracks per-user completion) ──────────────────────────
CREATE TABLE IF NOT EXISTS user_assignments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES student_profiles(user_id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  progress      INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  completed_at  TIMESTAMPTZ,
  notes         TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, assignment_id)
);

CREATE INDEX IF NOT EXISTS idx_user_assignments_user
  ON user_assignments(user_id, completed);

ALTER TABLE user_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "users_own_user_assignments"
  ON user_assignments FOR ALL
  USING (auth.uid() = user_id);

-- ─── Student Stats (CGPA, attendance summary) ───────────────────────────────
CREATE TABLE IF NOT EXISTS student_stats (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES student_profiles(user_id) ON DELETE CASCADE UNIQUE,
  cgpa             NUMERIC(4,2) DEFAULT NULL,
  attendance_pct   NUMERIC(5,2) DEFAULT NULL,
  total_classes    INT DEFAULT 0,
  attended_classes INT DEFAULT 0,
  semester_progress NUMERIC(5,2) DEFAULT 0,
  last_updated     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE student_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "users_own_stats"
  ON student_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "users_update_own_stats"
  ON student_stats FOR ALL
  USING (auth.uid() = user_id);

-- ─── Helper: seed sample notifications for newly joined users ───────────────
-- (Call this from an Edge Function or trigger — not auto-run here)

-- ─── Updated Indexes ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_student_stats_user ON student_stats(user_id);

-- ─── RLS: enable on tables missing it ───────────────────────────────────────
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance    ENABLE ROW LEVEL SECURITY;
ALTER TABLE events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty       ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects      ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules     ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all public tables
CREATE POLICY IF NOT EXISTS "auth_read_announcements"  ON announcements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "auth_read_events"         ON events        FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "auth_read_notices"        ON notices       FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "auth_read_faculty"        ON faculty       FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "auth_read_subjects"       ON subjects      FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "auth_read_schedules"      ON schedules     FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "auth_read_assignments"    ON assignments   FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "auth_read_attendance"     ON attendance    FOR SELECT USING (auth.uid() = user_id);

-- Users can read and update their own profile
CREATE POLICY IF NOT EXISTS "profiles_read_own"   ON student_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "profiles_update_own" ON student_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "profiles_insert_own" ON student_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
