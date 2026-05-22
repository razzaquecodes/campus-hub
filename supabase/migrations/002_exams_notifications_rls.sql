-- Exams
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 180,
  room TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push notification queue (processed by Edge Function → Expo Push)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  push_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

-- ─── Row Level Security examples ───────────────────────────────────────────

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Users: read/update own profile
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- Attendance: students see own records
CREATE POLICY "attendance_select_own" ON attendance FOR SELECT USING (auth.uid() = user_id);

-- Teachers/admins insert attendance (role check via users table)
CREATE POLICY "attendance_insert_staff" ON attendance FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'teacher', 'class_rep')
    )
  );

-- Announcements: read if scope matches student profile
CREATE POLICY "announcements_select_scoped" ON announcements FOR SELECT
  USING (
    scope = 'college'
    OR (scope = 'branch' AND branch_id = (SELECT branch_id FROM users WHERE id = auth.uid()))
    OR (scope = 'semester' AND semester_id = (SELECT semester_id FROM users WHERE id = auth.uid()))
    OR (scope = 'section' AND section_id = (SELECT section_id FROM users WHERE id = auth.uid()))
  );

-- Staff can create announcements
CREATE POLICY "announcements_insert_staff" ON announcements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'teacher', 'class_rep')
    )
  );

-- Notifications: own only
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ─── Realtime (enable in Supabase Dashboard → Database → Replication) ───────
-- publication: supabase_realtime
-- tables: announcements, attendance, notifications
