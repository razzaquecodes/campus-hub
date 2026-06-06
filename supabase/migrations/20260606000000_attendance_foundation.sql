create extension if not exists "pgcrypto";

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  faculty_id text not null,
  subject text not null,
  subject_code text,
  branch text check (branch is null or branch in ('CSE', 'CE', 'ME', 'EE', 'ECE')),
  year integer check (year is null or year between 1 and 4),
  section text check (section is null or section in ('A', 'B', 'C', 'D')),
  target jsonb not null default '{"entireCollege": true}'::jsonb,
  session_code text not null unique,
  status text not null default 'active' check (status in ('scheduled', 'active', 'closed', 'expired')),
  required_methods text[] not null default array['MANUAL']::text[],
  board_image_url text,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  expires_at timestamptz,
  live_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance_submissions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  student_id text not null,
  student_roll text not null,
  student_name text,
  selfie_url text,
  board_image_url text,
  status text not null default 'present' check (status in ('present', 'late', 'absent')),
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  verified_methods text[] not null default array['MANUAL']::text[],
  fraud_score numeric(5, 2),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (session_id, student_roll)
);

create table if not exists public.attendance_audit (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  submission_id uuid references public.attendance_submissions(id) on delete set null,
  actor_id text not null,
  actor_role text not null check (actor_role in ('student', 'faculty', 'system')),
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists attendance_sessions_active_target_idx
  on public.attendance_sessions (status, branch, year, section, created_at desc);

create index if not exists attendance_submissions_session_idx
  on public.attendance_submissions (session_id, submitted_at desc);

create index if not exists attendance_audit_session_idx
  on public.attendance_audit (session_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists attendance_sessions_set_updated_at on public.attendance_sessions;
create trigger attendance_sessions_set_updated_at
before update on public.attendance_sessions
for each row execute function public.set_updated_at();

create or replace function public.refresh_attendance_live_count()
returns trigger
language plpgsql
as $$
begin
  update public.attendance_sessions
  set live_count = (
    select count(*)
    from public.attendance_submissions
    where session_id = coalesce(new.session_id, old.session_id)
      and status in ('present', 'late')
  )
  where id = coalesce(new.session_id, old.session_id);

  return coalesce(new, old);
end;
$$;

drop trigger if exists attendance_submissions_refresh_live_count on public.attendance_submissions;
create trigger attendance_submissions_refresh_live_count
after insert or update or delete on public.attendance_submissions
for each row execute function public.refresh_attendance_live_count();

alter table public.attendance_sessions enable row level security;
alter table public.attendance_submissions enable row level security;
alter table public.attendance_audit enable row level security;

drop policy if exists "attendance sessions readable" on public.attendance_sessions;
create policy "attendance sessions readable"
on public.attendance_sessions for select
using (true);

drop policy if exists "attendance submissions readable" on public.attendance_submissions;
create policy "attendance submissions readable"
on public.attendance_submissions for select
using (true);

drop policy if exists "attendance submissions insertable" on public.attendance_submissions;
create policy "attendance submissions insertable"
on public.attendance_submissions for insert
with check (true);
