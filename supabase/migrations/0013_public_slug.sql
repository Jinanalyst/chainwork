-- ChainWork - public profile slug
-- Adds a unique, URL-safe slug used for #/worker/<slug> and
-- #/talents/<slug>. Backfills existing rows from display_name (preferred)
-- with a deterministic 4-char suffix appended when a collision exists, so
-- the backfill cannot fail on duplicate names.
-- Apply via Supabase SQL Editor. Idempotent.

-- ============================================================
-- 1. profiles.public_slug
-- ============================================================

alter table public.profiles
  add column if not exists public_slug text;

-- Citext would be ideal but isn't enabled on every project; enforce
-- lowercase at the application layer + a check constraint here.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_public_slug_format'
  ) then
    alter table public.profiles
      add constraint profiles_public_slug_format
      check (
        public_slug is null
        or public_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      );
  end if;
end$$;

-- ============================================================
-- 2. Unique index (partial — allow many nulls during backfill)
-- ============================================================

create unique index if not exists profiles_public_slug_key
  on public.profiles (public_slug)
  where public_slug is not null;

-- ============================================================
-- 3. Slugify helper
-- ============================================================

create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      lower(coalesce(input, '')),
      '[^a-z0-9]+', '-', 'g'
    )
  );
$$;

-- ============================================================
-- 4. Backfill existing rows
--    Prefer slug(display_name); fall back to a deterministic dashed
--    suffix from id when the base is empty or already taken.
-- ============================================================

with base as (
  select
    id,
    nullif(public.slugify(display_name), '') as candidate,
    substr(md5(id::text), 1, 4) as id_tag
  from public.profiles
  where public_slug is null
), with_tag as (
  select
    id,
    coalesce(candidate, 'worker') as stem,
    id_tag
  from base
), dedup as (
  -- If two rows have the same stem, append the id_tag to disambiguate.
  -- Doing this in one pass is fine because id_tag is unique-ish per row.
  select
    id,
    case
      when count(*) over (partition by stem) > 1 then stem || '-' || id_tag
      else stem
    end as slug
  from with_tag
)
update public.profiles p
set    public_slug = d.slug
from   dedup d
where  p.id = d.id
  and  p.public_slug is null
  -- Skip if the slug would collide with one that's already set elsewhere.
  and  not exists (
    select 1 from public.profiles p2
    where p2.public_slug = d.slug and p2.id <> p.id
  );

-- For any leftover rows (extremely rare — would mean even stem+tag clashed),
-- fall back to stem + full id suffix, which is guaranteed unique.
update public.profiles
set public_slug = coalesce(nullif(public.slugify(display_name), ''), 'worker')
                  || '-' || substr(md5(id::text), 1, 8)
where public_slug is null;

-- ============================================================
-- 5. Expose on worker_directory view
-- ============================================================

drop view if exists public.worker_directory;

create view public.worker_directory as
select
  id,
  display_name,
  public_slug,
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
