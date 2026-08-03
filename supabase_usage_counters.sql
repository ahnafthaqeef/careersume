-- Quiet daily usage caps for endpoints that consume OUR infra (scraping,
-- searching). Resume generation itself is BYOK and is never limited by this.
-- Run this in the Supabase SQL editor for the Careersume project.

create table if not exists public.usage_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default (now() at time zone 'utc')::date,
  endpoint text not null,
  count int not null default 0,
  primary key (user_id, day, endpoint)
);

-- 'parse-profile' left this list when resume parsing moved into the browser.
-- Its counters are dead weight now, and the constraint below is validated
-- against existing rows, so they have to go before it can be added back.
delete from public.usage_counters where endpoint = 'parse-profile';

-- Only known endpoints may accrue usage; blocks junk endpoint strings.
alter table public.usage_counters drop constraint if exists usage_counters_endpoint_check;
alter table public.usage_counters add constraint usage_counters_endpoint_check
  check (endpoint in ('fetch-job-url', 'search-jobs'));

-- Service-role only; no user policies. Routes call increment_usage()
-- (security definer) via the admin client, never direct table access.
alter table public.usage_counters enable row level security;

create or replace function public.increment_usage(p_user uuid, p_endpoint text)
returns int language sql security definer
set search_path = public, pg_temp
as $$
  insert into public.usage_counters (user_id, endpoint, count) values (p_user, p_endpoint, 1)
  on conflict (user_id, day, endpoint) do update set count = usage_counters.count + 1
  returning count;
$$;

-- PostgREST exposes every public-schema function as an RPC by default, and a
-- security-definer function runs as its owner regardless of caller. Without
-- this, any authenticated user could call increment_usage() directly and
-- bump another user's counter (targeted quota DoS). Only the app server
-- (service_role, via adminClient) may call it.
revoke execute on function public.increment_usage(uuid, text) from public, anon, authenticated;
grant execute on function public.increment_usage(uuid, text) to service_role;
