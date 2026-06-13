-- Create Enum for update type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'makaut_update_type') THEN
        CREATE TYPE makaut_update_type AS ENUM ('notice', 'exam_form', 'result', 'schedule', 'announcement');
    END IF;
END$$;

-- Create the updates table
CREATE TABLE IF NOT EXISTS public.makaut_updates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    type makaut_update_type NOT NULL,
    url TEXT,
    date_published TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    content_hash TEXT UNIQUE NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.makaut_updates IS 'Stores updates, notices, and results fetched from MAKAUT';

-- Create logs table for observability
CREATE TABLE IF NOT EXISTS public.makaut_sync_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
    items_added INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.makaut_sync_logs IS 'Logs each run of the MAKAUT sync edge function';

-- RLS Policies

-- 1. Updates table
ALTER TABLE public.makaut_updates ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read updates
CREATE POLICY "Enable read access for authenticated users on makaut_updates" 
ON public.makaut_updates 
FOR SELECT 
TO authenticated 
USING (true);

-- Only service role can insert/update/delete updates
CREATE POLICY "Enable insert for service role on makaut_updates" 
ON public.makaut_updates 
FOR INSERT 
TO service_role 
WITH CHECK (true);

CREATE POLICY "Enable update for service role on makaut_updates" 
ON public.makaut_updates 
FOR UPDATE 
TO service_role 
USING (true);

CREATE POLICY "Enable delete for service role on makaut_updates" 
ON public.makaut_updates 
FOR DELETE 
TO service_role 
USING (true);

-- 2. Sync Logs table
ALTER TABLE public.makaut_sync_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can interact with logs
CREATE POLICY "Enable all for service role on makaut_sync_logs" 
ON public.makaut_sync_logs 
FOR ALL 
TO service_role 
USING (true);
