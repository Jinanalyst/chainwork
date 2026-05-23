-- ChainWork — worker directory v2
-- Surface every worker/both-role profile, even before they've set a
-- display_name (the frontend falls back to a deterministic dashed-words
-- handle derived from the wallet address). Adds wallet_address so the
-- talents page can compute that handle without extra round-trips.
-- Apply via Supabase SQL Editor. Idempotent.

create or replace view public.worker_directory as
select
  id,
  display_name,
  company,
  bio,
  avatar_url,
  wallet_address,
  updated_at
from public.profiles
where role in ('worker', 'both');

grant select on public.worker_directory to anon, authenticated;
