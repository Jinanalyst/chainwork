-- ChainWork — public job board
-- Surface every OPEN task as a public, read-only job listing so the Jobs
-- page (#/jobs) can show real live hiring jobs to anyone — even before
-- sign-in. Mirrors the worker_directory pattern: a plain (non-invoker)
-- view runs with the owner's rights, so it bypasses the tasks RLS policy
-- and exposes ONLY open rows with safe hirer fields. Contact email,
-- assigned talent, internal notes, etc. are never selected here.
-- Apply via Supabase SQL Editor. Idempotent.

-- Make sure the columns the view references exist on this database. Some
-- instances never picked up the add-column from 0001, so guard them here.
alter table public.tasks add column if not exists payment_structure text;
alter table public.tasks add column if not exists deadline date;

create or replace view public.job_listings as
select
  t.id,
  t.title,
  t.description,
  t.category,
  t.skills,
  t.budget_cents,
  t.budget_currency,
  t.payment_structure,
  t.deadline,
  t.created_at,
  t.last_activity_at,
  p.display_name as hirer_name,
  p.company      as hirer_company,
  p.avatar_url   as hirer_avatar
from public.tasks t
join public.profiles p on p.id = t.hirer_id
where t.status = 'open';

grant select on public.job_listings to anon, authenticated;
