-- 0024_employer_subscriptions.sql
-- ChainWork — single annual "Verified Employer" subscription.
--
-- Replaces the old per-hire Pro membership model (0004_pro_memberships.sql), which
-- derived "hires included / used / remaining" from verified payment_proofs rows.
-- The new product is one flat plan: 990,000 KRW / year, paid in USDT (BEP20) via
-- NOWPayments. A subscription is a simple status + expiry, written only by the
-- /api/nowpayments/webhook serverless function using the service-role key.
--
-- Apply via Supabase SQL Editor. Idempotent.

-- ============================================================
-- 1. employer_subscriptions table
-- ============================================================

create table if not exists public.employer_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  status      text not null default 'active'
                check (status in ('active','expired','cancelled')),
  started_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  payment_id  text,                      -- NOWPayments payment id (idempotency key)
  created_at  timestamptz not null default now()
);

-- One row per NOWPayments payment, so duplicate "finished" IPNs upsert instead
-- of inserting a second subscription.
create unique index if not exists employer_subscriptions_payment_id_uq
  on public.employer_subscriptions (payment_id)
  where payment_id is not null;

create index if not exists employer_subscriptions_user_id_idx
  on public.employer_subscriptions (user_id);

-- ============================================================
-- 2. Row Level Security
--    Owning user can read their own subscriptions. Writes are server-only via
--    the service-role key (which bypasses RLS), mirroring 0015_payments.sql.
-- ============================================================

alter table public.employer_subscriptions enable row level security;

drop policy if exists "employer_subscriptions_self_read" on public.employer_subscriptions;
create policy "employer_subscriptions_self_read"
  on public.employer_subscriptions for select
  using (auth.uid() = user_id);

-- No insert/update/delete policies — those are server-only via service role.

-- ============================================================
-- 3. RPC: employer_subscription_status — status for the current user (or a uid)
--    Returns the most-recent subscription row, with `active` computed live so an
--    expired-but-not-yet-swept row still reports inactive.
-- ============================================================

create or replace function public.employer_subscription_status(uid uuid default null)
returns table (
  active      boolean,
  status      text,
  started_at  timestamptz,
  expires_at  timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with target as (
    select coalesce(uid, auth.uid()) as id
  ),
  latest as (
    select s.*
    from public.employer_subscriptions s, target
    where s.user_id = target.id
    order by s.created_at desc
    limit 1
  )
  select
    (l.status = 'active' and l.expires_at > now()) as active,
    l.status,
    l.started_at,
    l.expires_at
  from latest l;
$$;

grant execute on function public.employer_subscription_status(uuid) to authenticated;

-- ============================================================
-- 4. Retire the legacy per-hire Pro membership model (0004)
-- ============================================================

drop function if exists public.pro_status(uuid);
drop view     if exists public.pro_memberships;
drop function if exists public.pro_hire_count_from_ref(text);
