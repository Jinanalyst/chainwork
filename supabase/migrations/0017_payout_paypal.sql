-- ChainWork — PayPal as a third worker payout option.
-- Extends 0016 (bank). Workers without a Korean bank or crypto wallet can
-- now receive earnings to a PayPal email. The hirer-facing RPC surfaces the
-- email so direct PayPal sends are possible from the task detail panel.
-- Apply via Supabase SQL Editor. Idempotent.

alter table public.profiles add column if not exists payout_paypal_email text;

-- Widen the method check to include 'paypal'.
alter table public.profiles drop constraint if exists profiles_payout_method_check;
alter table public.profiles
  add constraint profiles_payout_method_check
  check (payout_method in ('wallet', 'bank', 'paypal') or payout_method is null);

-- Return shape changes from 0016 (adds payout_paypal_email), so drop first.
-- CREATE OR REPLACE can't change OUT-parameter columns.
drop function if exists public.task_worker_payout(uuid) cascade;

create function public.task_worker_payout(task_id uuid)
returns table (
  worker_id            uuid,
  display_name         text,
  payout_method        text,
  payout_address       text,
  payout_chain         text,
  payout_token         text,
  payout_bank_name     text,
  payout_account_holder text,
  payout_paypal_email  text
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
    pr.payout_account_holder,
    pr.payout_paypal_email
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
