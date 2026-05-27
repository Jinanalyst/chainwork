-- ChainWork - restore broad SELECT policy on profiles
-- The worker_directory view inherits RLS from public.profiles. If the
-- SELECT policy is scoped to `id = auth.uid()` (e.g. edited in the
-- dashboard, or 0001 only half-applied), each signed-in user only sees
-- their own row on the Talents page. Restores the intended behavior:
-- anyone (incl. logged-out visitors) can browse worker profiles; writes
-- remain owner-only via the existing self_update / self_insert policies.
-- Apply via Supabase SQL Editor. Idempotent.

drop policy if exists "profiles_read" on public.profiles;

create policy "profiles_read"
  on public.profiles for select
  to authenticated, anon
  using (true);
