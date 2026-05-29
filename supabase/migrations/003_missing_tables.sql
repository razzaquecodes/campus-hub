-- CampusHub Migration 003
-- Adds: notifications, achievements, user_assignments, student_stats
-- Adds: missing columns to users table
-- Adds: full RLS policies

-- ─── Notifications ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES student_profiles(user_id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'general'
              CHECK (category IN ('general','announcement','event','attendance','assignment','placement','result')),
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

-- ─── Placements ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS placements (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES student_profiles(user_id) ON DELETE CASCADE,
  company      TEXT NOT NULL,
  role         TEXT NOT NULL,
  package_lpa  NUMERIC(6,2),
  placed_at    DATE,
  offer_type   TEXT DEFAULT 'fulltime' CHECK (offer_type IN ('fulltime','internship','ppo')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "authenticated_read_placements"
  ON placements FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ─── Helper: seed sample notifications for newly joined users ───────────────
-- (Call this from an Edge Function or trigger — not auto-run here)

-- ─── Updated Indexes ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_placements_date ON placements(placed_at DESC);
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

-- ─── Seed: insert sample notifications for testing ──────────────────────────
-- These insert only if the notifications table is empty
-- In production, remove this block and use Edge Functions
DO $$
DECLARE
  sample_user_id UUID;
BEGIN
  -- Only seed if table is empty
  IF (SELECT COUNT(*) FROM notifications) = 0 THEN
    -- Get first user (for dev seeding)
    SELECT user_id INTO sample_user_id FROM student_profiles LIMIT 1;
    IF sample_user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, body, category) VALUES
        (sample_user_id, '4th Sem Exam Schedule Released', 'End-semester exams start June 10. Download your admit card from the MAKAUT portal.', 'announcement'),
        (sample_user_id, 'Attendance Alert: DAA Lab', 'Your attendance in DAA Lab has dropped below 75%. Minimum required: 75%.', 'attendance'),
        (sample_user_id, 'Assignment Due Tomorrow', 'Graph Algorithms Analysis is due tomorrow at 11:59 PM.', 'assignment'),
        (sample_user_id, 'BBIT TechFest Registration Open', 'Register your team for BBIT Annual TechFest. Last date: May 30.', 'event'),
        (sample_user_id, 'Placement Drive: TCS NextStep', 'TCS is conducting a campus placement drive on June 15. Eligibility: 7.0 CGPA.', 'placement');
    END IF;
  END IF;
END $$;
