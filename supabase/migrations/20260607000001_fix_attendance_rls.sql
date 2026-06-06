-- ============================================================
-- Migration: Fix attendance RLS + timer expiry + audit writes
-- ============================================================

-- 1. Add missing INSERT policy for attendance_sessions
DROP POLICY IF EXISTS "attendance sessions insertable" ON public.attendance_sessions;
CREATE POLICY "attendance sessions insertable"
ON public.attendance_sessions FOR INSERT
WITH CHECK (true);

-- 2. Add missing UPDATE policy for attendance_sessions (needed for closeSession)
DROP POLICY IF EXISTS "attendance sessions updatable" ON public.attendance_sessions;
CREATE POLICY "attendance sessions updatable"
ON public.attendance_sessions FOR UPDATE
USING (true)
WITH CHECK (true);

-- 3. Ensure realtime replication is enabled for both attendance tables
-- (Run in Supabase Dashboard if using managed Supabase)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_sessions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_submissions;

-- 4. Add INSERT policy for attendance_audit (was missing)
DROP POLICY IF EXISTS "attendance audit insertable" ON public.attendance_audit;
CREATE POLICY "attendance audit insertable"
ON public.attendance_audit FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "attendance audit readable" ON public.attendance_audit;
CREATE POLICY "attendance audit readable"
ON public.attendance_audit FOR SELECT
USING (true);

-- 5. Add guard: prevent submissions to closed/expired sessions
-- via a DB constraint CHECK trigger
CREATE OR REPLACE FUNCTION public.guard_attendance_submission()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  session_status TEXT;
  session_expires TIMESTAMPTZ;
BEGIN
  SELECT status, expires_at INTO session_status, session_expires
  FROM public.attendance_sessions
  WHERE id = NEW.session_id;

  IF session_status IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF session_status != 'active' THEN
    RAISE EXCEPTION 'Session is not active (status: %)', session_status;
  END IF;

  IF session_expires IS NOT NULL AND now() > session_expires THEN
    -- Auto-close expired sessions
    UPDATE public.attendance_sessions
    SET status = 'expired', updated_at = now()
    WHERE id = NEW.session_id;
    RAISE EXCEPTION 'Session has expired';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_attendance_submission_trigger ON public.attendance_submissions;
CREATE TRIGGER guard_attendance_submission_trigger
BEFORE INSERT ON public.attendance_submissions
FOR EACH ROW EXECUTE FUNCTION public.guard_attendance_submission();
