-- Enable Row Level Security
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own faculty record
CREATE POLICY "Faculty can read their own profile" 
ON public.faculty 
FOR SELECT 
TO authenticated 
USING (LOWER(email) = LOWER(auth.jwt() ->> 'email'));

-- Depending on your requirements, you may also want to add policies for insert/update/delete.
-- For now, this allows the SELECT query during login to succeed.
