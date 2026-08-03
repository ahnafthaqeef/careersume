-- Core tables: the per-user profile row, and the logs the app writes as you use
-- it. Run this FIRST, before every other migration, since the feedback policy
-- and the resume log both point at profiles.
-- Run this in the Supabase SQL editor for the Careersume project.

-- One row per auth user, created by the trigger at the bottom of this file.
-- `role` is what gates the admin panel; everything else is display data copied
-- off the auth user at sign-up.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

-- One row per resume the builder finishes. Written by /api/generate-resume
-- through the service-role client, read back by /history, /api/user-stats, and
-- the admin panel.
-- user_id points at profiles rather than auth.users so PostgREST can resolve
-- the `profiles(email)` embed the admin panel selects. The auth schema is not
-- exposed, so an auth.users reference gives it no path to the email.
create table if not exists public.resume_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_title text,
  company text,
  job_description_text text,
  resume_json jsonb,
  template text,
  ai_provider text,
  tokens_used int,
  created_at timestamptz not null default now()
);

create index if not exists resume_generations_user_id_created_at
  on public.resume_generations (user_id, created_at desc);

-- Cover letters, listed alongside resumes in /history.
create table if not exists public.cover_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_title text,
  company text,
  job_description_text text,
  cover_letter_text text not null,
  created_at timestamptz not null default now()
);

create index if not exists cover_letters_user_id_created_at
  on public.cover_letters (user_id, created_at desc);

-- Before and after scores from the ATS boost pass, so the improvement is
-- measurable over time. Written by /api/ats-boost.
create table if not exists public.ats_boosts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  original_score int not null,
  boosted_score int not null,
  created_at timestamptz not null default now()
);

-- RLS. Users reach their own rows and nothing else; the admin panel reads
-- everyone's through the service-role client, which bypasses these.
alter table public.profiles enable row level security;
alter table public.resume_generations enable row level security;
alter table public.cover_letters enable row level security;
alter table public.ats_boosts enable row level security;

-- Read only, deliberately. The trigger below owns row creation, and a user who
-- could write their own profile row could set role = 'admin' on it.
drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "own generations read" on public.resume_generations;
create policy "own generations read" on public.resume_generations
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own generations write" on public.resume_generations;
create policy "own generations write" on public.resume_generations
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "own cover letters read" on public.cover_letters;
create policy "own cover letters read" on public.cover_letters
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own cover letters write" on public.cover_letters;
create policy "own cover letters write" on public.cover_letters
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "own boosts read" on public.ats_boosts;
create policy "own boosts read" on public.ats_boosts
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own boosts write" on public.ats_boosts;
create policy "own boosts write" on public.ats_boosts
  for insert to authenticated with check (auth.uid() = user_id);

-- Nothing in the app inserts a profile, so the row has to appear the moment the
-- auth user does. full_name is the value /auth/register passes as sign-up
-- metadata, and the Google provider fills the same field.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Every account starts as 'user'. To reach /admin on your own instance,
-- register first and then promote yourself:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
