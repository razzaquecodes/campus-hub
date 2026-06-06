-- ============================================================
-- Migration: Fix announcements table — add missing columns
-- the app code writes (target jsonb, category, status, author_name)
-- while keeping backward-compatible with existing scope-based columns
-- ============================================================

-- Add missing columns that announcement.repository.ts writes to
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS target JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General Notice'
    CHECK (category IN ('General Notice', 'Assignment', 'Study Material', 'Important Alert', 'Event', 'Holiday')),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'archived')),
  ADD COLUMN IF NOT EXISTS author_name TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;  -- alias for body used by CampusAnnouncement type

-- Make scope nullable since new code uses target jsonb instead
ALTER TABLE public.announcements
  ALTER COLUMN scope DROP NOT NULL;

-- Backfill description from body for existing rows
UPDATE public.announcements SET description = body WHERE description IS NULL;

-- Backfill status for existing rows
UPDATE public.announcements SET status = 'active' WHERE status IS NULL;

-- Ensure SELECT policy exists
DROP POLICY IF EXISTS "announcements readable by authenticated" ON public.announcements;
CREATE POLICY "announcements readable by authenticated"
ON public.announcements FOR SELECT
TO authenticated
USING (true);

-- Ensure INSERT policy exists (was missing in original migration)
DROP POLICY IF EXISTS "announcements insertable by authenticated" ON public.announcements;
CREATE POLICY "announcements insertable by authenticated"
ON public.announcements FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable realtime replication
-- (also set in Supabase Dashboard under Database > Replication)
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;

-- Index for target-based queries
CREATE INDEX IF NOT EXISTS idx_announcements_target
  ON public.announcements USING GIN (target);

CREATE INDEX IF NOT EXISTS idx_announcements_status_created
  ON public.announcements (status, created_at DESC);
