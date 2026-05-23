-- Public worker directory.
-- Exposes only profile fields that are safe for the unauthenticated talents page.

create or replace view public.worker_directory as
select
  id,
  display_name,
  company,
  bio,
  avatar_url,
  updated_at
from public.profiles
where role in ('worker', 'both')
  and nullif(trim(display_name), '') is not null;

grant select on public.worker_directory to anon, authenticated;
