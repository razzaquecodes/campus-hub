-- Supabase Migration: MAKAUT Account Linking Architecture


    -- Ensure a user can only have one MAKAUT profile
    CONSTRAINT unique_user_profile UNIQUE (user_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own MAKAUT profile"
    ON public.student_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own MAKAUT profile"
    ON public.student_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own MAKAUT profile"
    ON public.student_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Optional: Create an index for faster lookups by roll_number
CREATE INDEX IF NOT EXISTS idx_student_profiles_roll_number 
    ON public.student_profiles(roll_number);

CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id 
    ON public.student_profiles(user_id);
