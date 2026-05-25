-- Migration to fix missing UNIQUE constraint on user_id
-- Run this in your Supabase SQL Editor if you encountered Postgres error 42P10

ALTER TABLE public.student_profiles 
ADD CONSTRAINT unique_user_profile UNIQUE (user_id);
