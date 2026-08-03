-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)

create table if not exists job_applications (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete cascade not null,
  job_id          text not null,
  title           text not null,
  company         text not null,
  company_logo    text,
  location        text,
  employment_type text,
  source          text,
  apply_url       text,
  full_description text,
  status          text not null default 'saved'
                    check (status in ('saved','applied','interviewing','offer','rejected')),
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Unique constraint required for upsert onConflict: "user_id,job_id"
alter table job_applications add constraint job_applications_user_job_unique unique (user_id, job_id);

-- RLS: users only see their own rows
alter table job_applications enable row level security;

drop policy if exists "Users manage own applications" on job_applications;
create policy "Users manage own applications"
  on job_applications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at trigger
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists job_applications_updated_at on job_applications;
create trigger job_applications_updated_at
  before update on job_applications
  for each row execute function update_updated_at();
