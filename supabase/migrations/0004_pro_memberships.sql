-- ChainWork — Pro membership status
-- Derive a user's active Pro membership from the most-recently verified
-- payment_proof of kind 'pro-membership'. The reference encodes the plan
-- size as a trailing "-Nn" suffix (e.g. CW-P-AB3X9K-N12 → 12 hires).
-- "Hires used" = tasks posted by the hirer since the membership activated.
-- Apply via Supabase SQL Editor. Idempotent.

-- ============================================================
-- 1. Parse hire count from a CW-P reference
-- ============================================================

create or replace function public.pro_hire_count_from_ref(ref text)
returns int
language sql
immutable
as $$
  select case
    when ref is null then null
    else nullif(substring(ref from '-N(\d+)$'), '')::int
  end;
$$;

-- ============================================================
-- 2. Active pro_memberships view
--    One row per user → their most recent verified pro-membership proof.
--    Membership is "active" until 1 year after verified_at.
-- ============================================================

create or replace view public.pro_memberships as
select
  pp.user_id,
  pp.reference,
  pp.verified_at as activated_at,
  pp.verified_at + interval '1 year' as expires_at,
  public.pro_hire_count_from_ref(pp.reference) as hires_included
from public.payment_proofs pp
where pp.kind = 'pro-membership'
  and pp.status = 'verified'
  and pp.user_id is not null
  and pp.verified_at = (
    select max(p2.verified_at)
    from public.payment_proofs p2
    where p2.user_id = pp.user_id
      and p2.kind = 'pro-membership'
      and p2.status = 'verified'
  );

grant select on public.pro_memberships to authenticated;

-- ============================================================
-- 3. RPC: pro_status — full status for the current user (or a passed uid)
-- ============================================================

create or replace function public.pro_status(uid uuid default null)
returns table (
  active           boolean,
  reference        text,
  activated_at     timestamptz,
  expires_at       timestamptz,
  hires_included   int,
  hires_used       int,
  hires_remaining  int
)
language sql
stable
security definer
set search_path = public
as $$
  with target as (
    select coalesce(uid, auth.uid()) as id
  ),
  m as (
    select * from public.pro_memberships
    where user_id = (select id from target)
  ),
  used as (
    select count(*)::int as n
    from public.tasks t, m
    where t.hirer_id = (select id from target)
      and t.created_at >= m.activated_at
  )
  select
    (m.expires_at is not null and m.expires_at > now())            as active,
    m.reference,
    m.activated_at,
    m.expires_at,
    m.hires_included,
    coalesce(used.n, 0)                                             as hires_used,
    greatest(coalesce(m.hires_included, 0) - coalesce(used.n, 0), 0) as hires_remaining
  from m, used;
$$;

grant execute on function public.pro_status(uuid) to authenticated;
