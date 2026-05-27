-- ChainWork — KRW bank payout as an alternative to a crypto wallet.
-- Workers who signed in with Google or LinkedIn (no wallet of their own) need
-- a settlement destination. We add a bank-account path alongside the existing
-- payout_address/chain/token columns and gate which one is active with
-- payout_method ('wallet' | 'bank'). The KRW bank flow settles via the PG,
-- so the hirer never sees the account number — only that it's configured.
-- Apply via Supabase SQL Editor. Idempotent.

alter table public.profiles add column if not exists payout_method         text;  -- 'wallet' | 'bank' | null
alter table public.profiles add column if not exists payout_bank_name      text;  -- e.g. '국민은행', '신한은행'
alter table public.profiles add column if not exists payout_account_holder text;  -- 예금주
alter table public.profiles add column if not exists payout_account_number text;  -- digits + dashes, owner-readable only

-- Belt-and-suspenders: payout_method must be one of the known values.
do $$
begin
  alter table public.profiles
    add constraint profiles_payout_method_check
    check (payout_method in ('wallet', 'bank') or payout_method is null);
exception
  when duplicate_object then null;
end$$;

-- Bank account number is PII. Only the row's owner should ever read it.
-- The existing RLS policy on profiles already restricts UPDATE to the owner,
-- and the task_worker_payout RPC below is the only path that surfaces any
-- payout field to a counterparty — and it intentionally excludes
-- payout_account_number.

-- Extend the hirer-facing RPC so a hirer can tell whether the matched worker
-- chose bank settlement (no manual send needed) or a wallet (send to address).
-- The return shape changes from 0010, so we must DROP before recreating —
-- Postgres rejects CREATE OR REPLACE when the OUT-parameter columns differ.
drop function if exists public.task_worker_payout(uuid);

create function public.task_worker_payout(task_id uuid)
returns table (
  worker_id           uuid,
  display_name        text,
  payout_method       text,
  payout_address      text,
  payout_chain        text,
  payout_token        text,
  payout_bank_name    text,
  payout_account_holder text
  -- NOTE: payout_account_number is intentionally omitted — settlement is
  -- handled by ChainWork via the PG, the hirer never wires KRW directly.
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  caller   uuid := auth.uid();
  is_admin boolean := false;
begin
  if caller is null then
    return;
  end if;

  select coalesce(p.is_admin, false) into is_admin
  from public.profiles p
  where p.id = caller;

  return query
  select
    t.talent_id,
    pr.display_name,
    pr.payout_method,
    pr.payout_address,
    pr.payout_chain,
    pr.payout_token,
    pr.payout_bank_name,
    pr.payout_account_holder
  from public.tasks t
  join public.profiles pr on pr.id = t.talent_id
  where t.id = task_id
    and t.talent_id is not null
    and (
      t.hirer_id = caller
      or is_admin
    );
end;
$$;

grant execute on function public.task_worker_payout(uuid) to authenticated;
