-- ChainWork - persist the JoinAsWorker onboarding answers
-- Adds columns the /join-as-worker conversational form writes to, and
-- extends the worker_directory view so the public Talents page can render
-- real skills / title / location instead of inferring from bio.
-- Apply via Supabase SQL Editor. Idempotent.

-- ============================================================
-- 1. profiles: new join-flow columns
-- ============================================================

alter table public.profiles add column if not exists skills       text[] default '{}';
alter table public.profiles add column if not exists availability text;
alter table public.profiles add column if not exists experience   text;

-- ============================================================
-- 2. worker_directory view: expose the new fields
--    Drop + recreate (CREATE OR REPLACE can't reorder columns,
--    and we're inserting new ones between the existing ones).
-- ============================================================

drop view if exists public.worker_directory;

create view public.worker_directory as
select
  id,
  display_name,
  title,
  company,
  location,
  bio,
  skills,
  availability,
  portfolio_url,
  avatar_url,
  wallet_address,
  updated_at
from public.profiles
where role in ('worker', 'both');

grant select on public.worker_directory to anon, authenticated;
