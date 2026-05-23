-- ChainWork — payment proofs + admin verification
-- Apply via: Supabase Dashboard → SQL Editor → New query → paste → Run
-- Idempotent: safe to re-run.

-- ============================================================
-- 1. profiles: is_admin flag (used to gate admin-only access)
-- ============================================================

alter table public.profiles add column if not exists is_admin boolean default false;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- ============================================================
-- 2. payment_proofs
-- ============================================================

create table if not exists public.payment_proofs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid          references public.profiles(id) on delete set null,
  kind          text not null,                          -- 'task' | 'pro-membership' | 'user'
  reference     text not null,                          -- CW-T-XXXXXX / CW-P-XXXXXX-Nn / CW-U-XXXXXX
  amount_text   text,                                   -- free-form (e.g. "$1,500" or "1500 USDC")
  token         text,                                   -- 'USDC' | 'USDT'
  chain         text,                                   -- 'Base' | 'Tron (TRC20)'
  to_address    text,                                   -- platform wallet that was funded
  from_wallet   text,                                   -- sender wallet (optional)
  tx_hash       text not null,
  status        text not null default 'pending',        -- 'pending' | 'verified' | 'rejected'
  verified_at   timestamptz,
  verified_by   uuid          references public.profiles(id) on delete set null,
  notes         text,                                   -- admin notes
  created_at    timestamptz default now()
);

create index if not exists payment_proofs_user_idx     on public.payment_proofs (user_id);
create index if not exists payment_proofs_ref_idx      on public.payment_proofs (reference);
create index if not exists payment_proofs_status_idx   on public.payment_proofs (status, created_at desc);
create unique index if not exists payment_proofs_tx_uq on public.payment_proofs (tx_hash);

-- ============================================================
-- 3. RLS
-- ============================================================

alter table public.payment_proofs enable row level security;

drop policy if exists "payment_proofs_select_own_or_admin" on public.payment_proofs;
drop policy if exists "payment_proofs_insert_self"         on public.payment_proofs;
drop policy if exists "payment_proofs_update_admin"        on public.payment_proofs;
drop policy if exists "payment_proofs_delete_admin"        on public.payment_proofs;

-- Users see their own; admins see all.
create policy "payment_proofs_select_own_or_admin"
  on public.payment_proofs for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Authenticated users insert proofs only as themselves; anon submission not allowed.
create policy "payment_proofs_insert_self"
  on public.payment_proofs for insert
  to authenticated
  with check (user_id = auth.uid() or user_id is null);

-- Only admins can verify / reject (update status, notes, verified_*).
create policy "payment_proofs_update_admin"
  on public.payment_proofs for update
  to authenticated
  using      (public.is_admin())
  with check (public.is_admin());

create policy "payment_proofs_delete_admin"
  on public.payment_proofs for delete
  to authenticated using (public.is_admin());

-- ============================================================
-- 4. Realtime (optional — admin page can subscribe to new proofs)
-- ============================================================

do $$
begin
  begin alter publication supabase_realtime add table public.payment_proofs; exception when duplicate_object then null; end;
end $$;

-- ============================================================
-- 5. Bootstrapping the first admin
-- ============================================================
--
-- After applying this migration, mark yourself as admin in the SQL Editor:
--
--   update public.profiles set is_admin = true where id = auth.uid();
--
-- (Run that statement while signed in to the dashboard as the account
-- that should have admin access.)
