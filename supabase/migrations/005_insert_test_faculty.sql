-- Migration 005: Insert test faculty member for development
-- Replace these values with actual faculty emails

-- Example: Insert a test faculty member (remove in production)
-- To add a faculty member, run this with their email:
-- INSERT INTO faculty (full_name, designation, department, email)
-- VALUES ('Faculty Name', 'Professor', 'Computer Science', 'faculty@example.com');

-- This migration logs the expected SQL pattern for adding faculty
-- Run the following in Supabase SQL Editor to add a faculty member:
-- INSERT INTO faculty (full_name, designation, department, email)
-- VALUES ('Test Faculty', 'Professor', 'Computer Science', 'testfaculty@example.com');