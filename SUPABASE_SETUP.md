# CampusHub — Supabase Setup Guide

## 1. Create project

1. Go to [supabase.com](https://supabase.com) → New project  
2. Copy **Project URL** and **anon public key**

## 2. Configure the app

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://czfylavvvvwohqkrhbdb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZnlsYXZ2dnd3b2hxa3JoYmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTA2NTgsImV4cCI6MjA5NDg2NjY1OH0.dPEb_6_3L4KPzVAaQWYK-FNTYeJZhSx0CiFkwvsuvgA

EXPO_PUBLIC_MAKAUT_API_URL=https://YOUR_PROJECT.supabase.co/functions/v1/makaut-auth
```

Restart Expo after changing `.env`:

```bash
npx expo start --clear
```

## 3. Run migrations

In Supabase → **SQL Editor**, run in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_exams_notifications_rls.sql`

## 4. Seed data (example)

```sql
INSERT INTO branches (code, name) VALUES ('CSE', 'Computer Science & Engineering');

INSERT INTO semesters (number, branch_id, academic_year)
SELECT 4, id, '2024-25' FROM branches WHERE code = 'CSE';

INSERT INTO sections (code, semester_id)
SELECT 'A', id FROM semesters LIMIT 1;
```

Add subjects, faculty, and attendance rows linked to `auth.users` after first student login.

## 5. Auth

- Students sign in via **MAKAUT credentials** in the app  
- `auth.service.ts` creates Supabase Auth user + `users` profile row  
- Profile fields (`branch_id`, `semester_id`, `section_id`) are set from roll number parsing

## 6. Row Level Security

RLS policies are in `002_exams_notifications_rls.sql`. Adjust per college policy.

## 7. Realtime

Dashboard → **Database** → **Replication** → enable for:

- `announcements`
- `attendance`
- `notifications`

App hooks: `src/hooks/use-realtime.ts`

## 8. Push notifications (placeholder)

1. Store Expo push tokens on `users` table (add column `expo_push_token`)  
2. Edge Function on `notifications` INSERT → call Expo Push API  
3. Client: `expo-notifications` + register token after login

## 9. MAKAUT verification (production)

Deploy Edge Function `makaut-auth` that:

1. Validates portal credentials server-side  
2. Returns student profile JSON  
3. Never exposes portal passwords to the client

Set `EXPO_PUBLIC_MAKAUT_API_URL` to the function URL.

## 10. Session storage

- **Supabase Auth** uses `@react-native-async-storage/async-storage` (works on web, iOS, Android, Expo Go).
- **Student profile cache** uses `src/lib/storage.ts` (SecureStore on native when available, AsyncStorage/localStorage fallback).

## 11. Demo mode (no Supabase)

If env vars are empty, the app uses mock data and works fully in **Expo Go**.

Demo login: `20300120001` / `makaut123` (tap the demo card on the login screen to auto-fill)
