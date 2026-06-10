-- Enable realtime for announcements and attendance tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_submissions;

-- Storage bucket for attendance captures (create via dashboard if this fails)
INSERT INTO storage.buckets (id, name, public)
VALUES ('attendance-captures', 'attendance-captures', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated and anon uploads for attendance captures
DROP POLICY IF EXISTS "attendance captures public read" ON storage.objects;
CREATE POLICY "attendance captures public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'attendance-captures');

DROP POLICY IF EXISTS "attendance captures insert" ON storage.objects;
CREATE POLICY "attendance captures insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'attendance-captures');
