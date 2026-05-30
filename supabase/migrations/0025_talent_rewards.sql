-- 0025_talent_rewards.sql
-- ChainWork — Talent Reward Program.
--
-- A percentage of platform revenue is allocated to a periodic Talent Reward
-- Pool and distributed to ranked, verified talents by weighted share. Four
-- moving parts:
--
--   1. reputation_events     — append-only ledger; the source of truth.
--   2. talent_profiles       — system-written cache of rank + component scores.
--   3. reward_pools          — one per period, funded from a revenue snapshot.
--   4. reward_distributions  — immutable per-talent payout ledger.
--
-- Writes are server-only, mirroring 0015_payments.sql / 0024_employer_subscriptions.sql:
-- owners get SELECT on their own rows via RLS; the engine functions are
-- SECURITY DEFINER and granted to service_role only (called from /api routes).
-- The pool is conserved by weighted shares — never the raw pool*mult*score
-- product — so SUM(reward_amount) == pool_amount (rounding dust swept on finalize).
--
-- Apply via Supabase SQL Editor. Idempotent: safe to re-run.

-- ============================================================
-- 0. Prerequisites
-- ============================================================

-- Subscription revenue can't be summed until subscriptions store an amount.
-- (NOWPayments webhook should populate this on the "finished" IPN.)
alter table public.employer_subscriptions
  add column if not exists amount numeric(14,2);

-- Platform admin allowlist + helper. No RLS policies: the table is only read
-- through is_admin(), which is SECURITY DEFINER.
create table if not exists public.app_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.app_admins enable row level security;

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.app_admins where user_id = uid);
$$;

grant execute on function public.is_admin(uuid) to anon, authenticated;

-- ============================================================
-- 1. reputation_events — append-only source of truth
-- ============================================================

create table if not exists public.reputation_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null check (kind in (
                'project_completed','rating_received','community_contribution',
                'profile_completed','identity_verified','activity','penalty')),
  task_id     uuid references public.tasks(id) on delete set null,
  points      numeric(10,2) not null default 0,    -- signed; penalty is negative
  rating      numeric(3,2)  check (rating between 0 and 5),
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists reputation_events_user_idx
  on public.reputation_events (user_id, created_at desc);
create index if not exists reputation_events_kind_idx
  on public.reputation_events (kind);

-- Idempotency: one project-completion / rating event per (user, task, kind),
-- so re-firing an emitter on retry upserts instead of double-counting.
create unique index if not exists reputation_events_task_uq
  on public.reputation_events (user_id, task_id, kind)
  where task_id is not null;

-- ============================================================
-- 2. talent_profiles — cached rank + scores (system-written, 1:1 with profiles)
-- ============================================================

create table if not exists public.talent_profiles (
  user_id             uuid primary key references public.profiles(id) on delete cascade,
  rank                int  not null default 1 check (rank between 1 and 4),  -- 1 Rookie..4 Elite
  reputation_score    numeric(12,2) not null default 0,
  completed_projects  int  not null default 0,
  average_rating      numeric(3,2)  not null default 0,
  community_score     numeric(12,2) not null default 0,
  profile_quality     numeric(5,2)  not null default 0,   -- 0..100
  activity_score      numeric(12,2) not null default 0,
  reward_points       numeric(14,2) not null default 0,   -- lifetime points earned
  is_verified         boolean not null default false,
  rank_computed_at    timestamptz,
  updated_at          timestamptz not null default now()
);

create index if not exists talent_profiles_rank_idx
  on public.talent_profiles (rank desc, reputation_score desc);
create index if not exists talent_profiles_score_idx
  on public.talent_profiles (reputation_score desc);

-- Rank change history for audit / "you leveled up" UX.
create table if not exists public.talent_rank_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  old_rank    int,
  new_rank    int not null,
  reason      text,
  created_at  timestamptz not null default now()
);

create index if not exists talent_rank_history_user_idx
  on public.talent_rank_history (user_id, created_at desc);

-- ============================================================
-- 3. reward_pools — one per period, funded from revenue snapshot
-- ============================================================

create table if not exists public.reward_pools (
  id              uuid primary key default gen_random_uuid(),
  period          text not null unique,               -- 'Q1-2026' or '2026-05'
  period_start    date not null,
  period_end      date not null,                      -- inclusive end date
  revenue         numeric(16,2) not null default 0,   -- snapshot at fund time, KRW
  allocation_pct  numeric(5,2)  not null default 10,  -- % of revenue -> pool
  pool_amount     numeric(16,2) not null default 0,   -- revenue * allocation_pct/100
  payout_currency text not null default 'KRW',
  status          text not null default 'draft'
                    check (status in ('draft','finalized','paid')),
  total_weight    numeric(16,4) not null default 0,   -- SUM(weight) at compute time
  finalized_at    timestamptz,
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- 4. reward_distributions — immutable per-talent ledger
-- ============================================================

create table if not exists public.reward_distributions (
  id               uuid primary key default gen_random_uuid(),
  reward_pool_id   uuid not null references public.reward_pools(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  rank             int  not null,
  rank_multiplier  numeric(5,4) not null,    -- 0 / 0.10 / 0.15 / 0.20
  contribution     numeric(8,6) not null,    -- normalized 0..1 within eligible set
  weight           numeric(16,6) not null,   -- multiplier * contribution
  reward_amount    numeric(16,2) not null,   -- pool_amount * weight/total_weight
  reward_points    numeric(14,2) not null default 0,
  payout_status    text not null default 'pending'
                     check (payout_status in ('pending','sent','failed')),
  payout_ref       text,                      -- NOWPayments payout id
  created_at       timestamptz not null default now(),
  unique (reward_pool_id, user_id)           -- one payout per talent per pool
);

create index if not exists reward_distributions_user_idx
  on public.reward_distributions (user_id, created_at desc);
create index if not exists reward_distributions_pool_idx
  on public.reward_distributions (reward_pool_id);

-- ============================================================
-- 5. Row Level Security
--    Owners read their own rows. talent_profiles + reward_pools are public
--    read (they power the talents directory / transparency). All writes are
--    server-only via service role / SECURITY DEFINER.
-- ============================================================

alter table public.reputation_events    enable row level security;
alter table public.talent_profiles      enable row level security;
alter table public.talent_rank_history  enable row level security;
alter table public.reward_pools          enable row level security;
alter table public.reward_distributions  enable row level security;

drop policy if exists "rep_events_self_read" on public.reputation_events;
create policy "rep_events_self_read"
  on public.reputation_events for select
  using (auth.uid() = user_id);

drop policy if exists "talent_profiles_read" on public.talent_profiles;
create policy "talent_profiles_read"
  on public.talent_profiles for select
  to anon, authenticated using (true);

drop policy if exists "rank_history_self_read" on public.talent_rank_history;
create policy "rank_history_self_read"
  on public.talent_rank_history for select
  using (auth.uid() = user_id);

drop policy if exists "reward_pools_read" on public.reward_pools;
create policy "reward_pools_read"
  on public.reward_pools for select
  to anon, authenticated using (true);

drop policy if exists "reward_dist_self_read" on public.reward_distributions;
create policy "reward_dist_self_read"
  on public.reward_distributions for select
  using (auth.uid() = user_id);

-- ============================================================
-- 6. Ranking engine
--    recompute_talent_profile(uid) folds the ledger into the cache for one
--    user; recompute_all_talents() drives it across the worker directory.
-- ============================================================

create or replace function public.recompute_talent_profile(uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_completed int;
  v_avg       numeric;
  v_reviews   int;
  v_comm      numeric;
  v_activity  numeric;
  v_verified  boolean;
  v_quality   numeric;
  v_score     numeric;
  v_rank      int;
  v_old_rank  int;
begin
  select
    count(*) filter (where kind = 'project_completed'),
    coalesce(avg(rating) filter (where kind = 'rating_received'), 0),
    count(*) filter (where kind = 'rating_received'),
    coalesce(sum(points) filter (where kind = 'community_contribution'), 0),
    coalesce(sum(points) filter (where kind = 'activity'
                                   and created_at > now() - interval '90 days'), 0),
    bool_or(kind = 'identity_verified')
  into v_completed, v_avg, v_reviews, v_comm, v_activity, v_verified
  from public.reputation_events
  where user_id = uid;

  v_verified := coalesce(v_verified, false);

  -- Profile completeness (0..100) from existing profiles columns.
  select (case when display_name   is not null then 25 else 0 end)
       + (case when bio            is not null then 25 else 0 end)
       + (case when avatar_url     is not null then 25 else 0 end)
       + (case when wallet_address is not null then 25 else 0 end)
  into v_quality
  from public.profiles
  where id = uid;
  v_quality := coalesce(v_quality, 0);

  -- Reward Score = completed + ratings + community + 0.5*quality + 0.5*activity.
  -- Rating term is dampened by review count so a single 5-star can't inflate it.
  v_score := v_completed * 5
           + (v_avg * 10 * least(v_reviews, 20) / 20.0)
           + v_comm
           + 0.5 * v_quality
           + 0.5 * v_activity;

  -- Rank gates (tune thresholds later).
  v_rank := 1;  -- Rookie
  if v_verified and v_avg >= 4.0 and v_quality >= 75 then
    v_rank := 2;  -- Verified
  end if;
  if v_rank = 2 and v_completed >= 5 and v_score >= 120 and v_comm > 0 then
    v_rank := 3;  -- Expert
  end if;
  if v_rank = 3 and v_completed >= 15 and v_score >= 400 then
    v_rank := 4;  -- Elite
  end if;

  select rank into v_old_rank from public.talent_profiles where user_id = uid;

  insert into public.talent_profiles as t
    (user_id, rank, reputation_score, completed_projects, average_rating,
     community_score, profile_quality, activity_score, is_verified,
     rank_computed_at, updated_at)
  values
    (uid, v_rank, v_score, v_completed, round(v_avg, 2),
     v_comm, v_quality, v_activity, v_verified, now(), now())
  on conflict (user_id) do update set
    rank               = excluded.rank,
    reputation_score   = excluded.reputation_score,
    completed_projects = excluded.completed_projects,
    average_rating     = excluded.average_rating,
    community_score    = excluded.community_score,
    profile_quality    = excluded.profile_quality,
    activity_score     = excluded.activity_score,
    is_verified        = excluded.is_verified,
    rank_computed_at   = now(),
    updated_at         = now();

  if v_old_rank is distinct from v_rank then
    insert into public.talent_rank_history (user_id, old_rank, new_rank, reason)
    values (uid, v_old_rank, v_rank, 'recompute');
  end if;
end $$;

create or replace function public.recompute_all_talents()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  n int := 0;
begin
  for r in
    select id from public.profiles where role in ('worker', 'both')
  loop
    perform public.recompute_talent_profile(r.id);
    n := n + 1;
  end loop;
  return n;
end $$;

-- ============================================================
-- 7. Reward engine
--    fund -> compute -> finalize. Idempotent while the pool is 'draft'.
-- ============================================================

-- 7a. Fund the pool from a revenue snapshot (payments + subscriptions in window).
create or replace function public.fund_reward_pool(
  p_period         text,
  p_start          date,
  p_end            date,
  p_allocation_pct numeric default 10
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.reward_pools;
  v_rev      numeric;
  v_id       uuid;
begin
  select * into v_existing from public.reward_pools where period = p_period;
  if v_existing.id is not null and v_existing.status <> 'draft' then
    raise exception 'pool % is already %; cannot re-fund', p_period, v_existing.status;
  end if;

  -- Revenue = paid one-off payments + verified subscription revenue in window.
  select coalesce(sum(amount), 0) into v_rev
  from public.payments
  where status = 'paid'
    and created_at >= p_start
    and created_at <  p_end + 1;

  v_rev := v_rev + coalesce((
    select sum(amount)
    from public.employer_subscriptions
    where amount is not null
      and started_at >= p_start
      and started_at <  p_end + 1
  ), 0);

  insert into public.reward_pools
    (period, period_start, period_end, revenue, allocation_pct, pool_amount, status)
  values
    (p_period, p_start, p_end, v_rev, p_allocation_pct,
     round(v_rev * p_allocation_pct / 100.0, 2), 'draft')
  on conflict (period) do update set
    revenue        = excluded.revenue,
    allocation_pct = excluded.allocation_pct,
    pool_amount    = excluded.pool_amount,
    period_start   = excluded.period_start,
    period_end     = excluded.period_end
  returning id into v_id;

  return v_id;
end $$;

-- 7b. Compute weighted shares. contribution = score / max(score) within the
--     eligible set; weight = multiplier * contribution; reward conserves pool.
create or replace function public.compute_reward_distribution(p_pool_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pool  public.reward_pools;
  v_total numeric;
begin
  select * into v_pool from public.reward_pools where id = p_pool_id;
  if v_pool.id is null then
    raise exception 'reward pool % not found', p_pool_id;
  end if;
  if v_pool.status <> 'draft' then
    raise exception 'pool % is %, not draft; refusing to recompute', p_pool_id, v_pool.status;
  end if;

  delete from public.reward_distributions where reward_pool_id = p_pool_id;

  with elig as (
    select
      t.user_id,
      t.rank,
      t.reputation_score,
      (array[0, 0, 0.10, 0.15, 0.20])[t.rank + 1] as mult  -- rank 1->0 .. rank 4->0.20
    from public.talent_profiles t
    where t.rank >= 2                 -- Rookie (0x) is ineligible
      and t.is_verified
      and t.reputation_score > 0
      and exists (                    -- must be active within the period
        select 1 from public.reputation_events e
        where e.user_id = t.user_id
          and e.created_at >= v_pool.period_start
          and e.created_at <  v_pool.period_end + 1
      )
  ),
  mx as (select max(reputation_score) as m from elig),
  weighted as (
    select
      e.user_id, e.rank, e.mult,
      e.reputation_score / mx.m            as contribution,
      e.mult * (e.reputation_score / mx.m) as weight
    from elig e, mx
    where mx.m > 0
  ),
  tot as (select sum(weight) as w from weighted)
  insert into public.reward_distributions
    (reward_pool_id, user_id, rank, rank_multiplier, contribution, weight,
     reward_amount, reward_points)
  select
    p_pool_id, w.user_id, w.rank, w.mult, w.contribution, w.weight,
    round(v_pool.pool_amount * w.weight / tot.w, 2),
    round(w.weight * 1000, 0)
  from weighted w, tot
  where tot.w > 0;

  select coalesce(sum(weight), 0) into v_total
  from public.reward_distributions where reward_pool_id = p_pool_id;

  update public.reward_pools set total_weight = v_total where id = p_pool_id;
end $$;

-- 7c. Finalize: freeze amounts, sweep rounding dust to the top earner so
--     SUM(reward_amount) == pool_amount exactly.
create or replace function public.finalize_reward_pool(p_pool_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pool public.reward_pools;
  v_sum  numeric;
  v_dust numeric;
  v_top  uuid;
begin
  select * into v_pool from public.reward_pools where id = p_pool_id;
  if v_pool.id is null then
    raise exception 'reward pool % not found', p_pool_id;
  end if;
  if v_pool.status <> 'draft' then
    raise exception 'pool % is already %', p_pool_id, v_pool.status;
  end if;

  select coalesce(sum(reward_amount), 0) into v_sum
  from public.reward_distributions where reward_pool_id = p_pool_id;

  v_dust := v_pool.pool_amount - v_sum;  -- rounding residue, may be + or -
  if v_dust <> 0 then
    select user_id into v_top
    from public.reward_distributions
    where reward_pool_id = p_pool_id
    order by reward_amount desc
    limit 1;

    if v_top is not null then
      update public.reward_distributions
      set reward_amount = reward_amount + v_dust
      where reward_pool_id = p_pool_id and user_id = v_top;
    end if;
  end if;

  update public.reward_pools
  set status = 'finalized', finalized_at = now()
  where id = p_pool_id;
end $$;

-- ============================================================
-- 8. Admin dashboard RPC (admin-gated, callable from the React page)
-- ============================================================

create or replace function public.admin_reward_overview(p_pool_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  j jsonb;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden: admin only';
  end if;

  select jsonb_build_object(
    'pool',        (select to_jsonb(p) from public.reward_pools p where p.id = p_pool_id),
    'recipients',  (select count(*) from public.reward_distributions where reward_pool_id = p_pool_id),
    'distributed', (select coalesce(sum(reward_amount), 0)
                    from public.reward_distributions where reward_pool_id = p_pool_id),
    'top_talents', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
                      select user_id, rank, reputation_score, completed_projects, average_rating
                      from public.talent_profiles
                      order by rank desc, reputation_score desc
                      limit 10) t)
  ) into j;

  return j;
end $$;

-- ============================================================
-- 9. Function grants
--    Engine functions are service-role only (called from /api routes with the
--    service-role key). Dashboard read + is_admin are callable by signed-in users.
-- ============================================================

revoke all on function public.recompute_talent_profile(uuid)        from public;
revoke all on function public.recompute_all_talents()               from public;
revoke all on function public.fund_reward_pool(text,date,date,numeric) from public;
revoke all on function public.compute_reward_distribution(uuid)     from public;
revoke all on function public.finalize_reward_pool(uuid)            from public;

grant execute on function public.recompute_talent_profile(uuid)        to service_role;
grant execute on function public.recompute_all_talents()               to service_role;
grant execute on function public.fund_reward_pool(text,date,date,numeric) to service_role;
grant execute on function public.compute_reward_distribution(uuid)     to service_role;
grant execute on function public.finalize_reward_pool(uuid)            to service_role;

grant execute on function public.admin_reward_overview(uuid) to authenticated;

-- ============================================================
-- 10. Seed cache rows for existing talents (no-op on re-run)
-- ============================================================

insert into public.talent_profiles (user_id)
select id from public.profiles where role in ('worker', 'both')
on conflict (user_id) do nothing;
