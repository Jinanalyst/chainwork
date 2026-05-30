-- 0022_drop_paypal_payout.sql
-- Reverses 0017_payout_paypal.sql: ChainWork no longer offers PayPal as a
-- worker payout method. Workers settle via Korean bank (KRW) or crypto wallet.
-- (A migration is already applied to the DB, so we reverse it here rather than
-- deleting 0017 from history.)
-- Apply via Supabase SQL Editor. Idempotent.

-- Demote any rows that were on PayPal so they don't violate the narrowed check.
update public.profiles set payout_method = null where payout_method = 'paypal';

-- Recreate the RPC without payout_paypal_email (return shape changes, so drop).
drop function if exists public.task_worker_payout(uuid) cascade;

create function public.task_worker_payout(task_id uuid)
returns table (
  worker_id             uuid,
  display_name          text,
  payout_method         text,
  payout_address        text,
  payout_chain          text,
  payout_token          text,
  payout_bank_name      text,
  payout_account_holder text
  -- payout_account_number still intentionally omitted (PG settles KRW).
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

-- Narrow the method check back to wallet/bank.
alter table public.profiles drop constraint if exists profiles_payout_method_check;
alter table public.profiles
  add constraint profiles_payout_method_check
  check (payout_method in ('wallet', 'bank') or payout_method is null);

-- Finally drop the column.
alter table public.profiles drop column if exists payout_paypal_email;
