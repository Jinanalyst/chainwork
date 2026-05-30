-- ChainWork - constrain profiles.role to known values
-- The `role` column (0001_init.sql) is plain text with no validation, so a
-- typo or stray write could store an invalid role and silently break the
-- worker_directory filter (role in ('worker','both')) and dashboard gating.
-- Restrict it to the three intended values. Apply via Supabase SQL Editor.
-- Idempotent.

-- Heal any rows that don't match the allowed set before adding the
-- constraint, otherwise the ALTER would fail on legacy/invalid data.
update public.profiles
  set role = 'both'
  where role is null or role not in ('hirer', 'worker', 'both');

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('hirer', 'worker', 'both'));
