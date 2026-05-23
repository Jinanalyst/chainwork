-- ChainWork — task_worker_payout RPC
-- Returns the worker's payout destination to the hirer on a task (or to an
-- admin). Uses SECURITY DEFINER to read columns past the table's row-level
-- policies, but only after verifying the caller is allowed.
-- Apply via Supabase SQL Editor. Idempotent.

create or replace function public.task_worker_payout(task_id uuid)
returns table (
  worker_id      uuid,
  display_name   text,
  payout_address text,
  payout_chain   text,
  payout_token   text
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

  -- Admin override.
  select coalesce(p.is_admin, false) into is_admin
  from public.profiles p
  where p.id = caller;

  return query
  select
    t.talent_id,
    pr.display_name,
    pr.payout_address,
    pr.payout_chain,
    pr.payout_token
  from public.tasks t
  join public.profiles pr on pr.id = t.talent_id
  where t.id = task_id
    and t.talent_id is not null
    and (
      t.hirer_id = caller  -- the hirer on this task
      or is_admin
    );
end;
$$;

grant execute on function public.task_worker_payout(uuid) to authenticated;
