-- Master profile, one row per user, synced from localStorage on first load.
-- Run this in the Supabase SQL editor.

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "own profile read"  on public.user_profiles for select using (auth.uid() = user_id);
create policy "own profile write" on public.user_profiles for insert with check (auth.uid() = user_id);
create policy "own profile update" on public.user_profiles for update using (auth.uid() = user_id);
