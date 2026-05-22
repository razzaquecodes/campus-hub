# CampusHub — Architecture & Setup Guide

## Auth Architecture

```
React Native App
     │
     │  POST { identifier, password }
     ▼
Supabase Edge Function  (/api/makaut/verify)
     │
     │  POST login form (server-side)
     ▼
MAKAUT Student Portal
     │
     │  HTML scrape → student profile JSON
     ▼
Supabase Edge Function  (returns MakautVerifiedProfile)
     │
     ▼
App: supabase.auth.signInWithPassword / signUp
     │
     ▼
Supabase Auth (JWT session, stored in AsyncStorage)
     │
     ▼
users table upsert (roll number, branch, semester, etc.)
```

**Student passwords are forwarded directly to the MAKAUT portal and are never stored.**

---

## File Map

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root layout — hydrates auth, controls splash, gates navigation |
| `app/(auth)/_layout.tsx` | Auth group stack (login, forgot-password, etc.) |
| `app/(auth)/login.tsx` | Login route entry point |
| `app/(tabs)/_layout.tsx` | Tab layout with `PremiumTabBar` |
| `navigation/TabBar.tsx` | Floating dock tab bar (Reanimated, haptics, blur) |
| `stores/auth.store.ts` | Zustand store — hydrate / signIn / signOut |
| `hooks/useAuth.ts` | Clean hook interface over auth store |
| `services/auth.service.ts` | Supabase auth + profile upsert |
| `services/makaut.service.ts` | MAKAUT verification (backend proxy) |
| `services/supabase-edge-function.ts` | Reference Edge Function (deploy to Supabase) |

---

## Setup Steps

### 1. Environment Variables

```env
# .env (root of your Expo project)
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
EXPO_PUBLIC_MAKAUT_API_URL=https://xxxx.supabase.co/functions/v1
```

### 2. Deploy the Edge Function

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref <your-project-ref>

# Copy the edge function
mkdir -p supabase/functions/makaut-verify
cp services/supabase-edge-function.ts supabase/functions/makaut-verify/index.ts

# Deploy
supabase functions deploy makaut-verify
```

### 3. Update Edge Function Selectors

Open `supabase/functions/makaut-verify/index.ts` and update:
- `MAKAUT_LOGIN_URL` — actual portal login endpoint
- `MAKAUT_PORTAL_URL` — profile page URL
- Form field names in `loginForm`
- HTML parsing patterns in `parseStudentProfile()`

### 4. Supabase Database Tables

```sql
-- Users table
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  roll_number text unique not null,
  email text unique not null,
  full_name text not null,
  role text not null default 'student',
  branch_id uuid references public.branches(id),
  semester_id uuid references public.semesters(id),
  section_id uuid references public.sections(id),
  college text,
  avatar_url text,
  is_verified boolean not null default false,
  makaut_verified_at timestamptz,
  created_at timestamptz default now()
);

-- Branches
create table public.branches (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null
);

-- Enable Row Level Security
alter table public.users enable row level security;
create policy "Users can read own profile"
  on public.users for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);
```

### 5. File Move Checklist

Move/rename files in your project to match the routing structure:

```
app/
  _layout.tsx          ← replace with outputs/_layout.tsx
  (auth)/
    _layout.tsx        ← new file
    login.tsx          ← move from app/login.tsx
  (tabs)/
    _layout.tsx        ← replace with outputs/(tabs)/_layout.tsx
    index.tsx          ← your existing home screen
    attendance.tsx     ← your existing attendance screen
    courses.tsx        ← your existing courses screen
    profile.tsx        ← your existing profile screen

navigation/
  TabBar.tsx           ← replace with outputs/navigation/TabBar.tsx

stores/
  auth.store.ts        ← replace with outputs/stores/auth.store.ts

hooks/
  useAuth.ts           ← new file

services/
  auth.service.ts      ← replace with outputs/services/auth.service.ts
  makaut.service.ts    ← replace with outputs/services/makaut.service.ts
```

---

## Key Fixes Explained

### Navigation
- **Problem**: `app/login.tsx` at root conflicts with `(auth)/login.tsx` and `(tabs)` group. Expo Router shows duplicate route errors.
- **Fix**: Move login to `app/(auth)/login.tsx`. Root `_layout.tsx` uses `AuthGate` component that redirects based on auth state.

### Navbar Jitter
- **Problem**: Shared values recreated on every render; `tabBarStyle: { display: 'none' }` conflicts with custom bar on some RN versions.
- **Fix**: `TabItem` is `React.memo`; shared values initialized once; `lazy: false` keeps screens mounted.

### Reanimated Issues
- **Problem**: `withSpring` called outside worklets; `.value` access on JS thread.
- **Fix**: All animations use `useAnimatedStyle` (runs on UI thread). Press handlers use `useCallback`.

### Auth State Flicker
- **Problem**: App renders tab screens briefly before redirect to login.
- **Fix**: `_layout.tsx` returns `null` until `isHydrated`. Splash screen stays up during hydration.

### Real MAKAUT Auth
- **Problem**: `makaut.service.ts` contained a hardcoded demo gate with no real backend path.
- **Fix**: Service proxies to `EXPO_PUBLIC_MAKAUT_API_URL/api/makaut/verify`. Edge Function does the actual portal login server-side. Demo fallback only when URL is unset.
