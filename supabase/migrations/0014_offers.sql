-- ChainWork — offers fan-out
-- When a hirer posts a task we create one offer row per targeted worker.
-- Workers see offers in their dashboard and can accept or decline.
-- Apply via Supabase SQL Editor. Idempotent.

-- ============================================================
-- 1. offers
-- ============================================================

create table if not exists public.offers (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references public.tasks(id)    on delete cascade,
  worker_id     uuid not null references public.profiles(id) on delete cascade,
  status        text not null default 'pending',  -- 'pending' | 'accepted' | 'declined'
  responded_at  timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (task_id, worker_id)
);

create index if not exists offers_worker_status_idx on public.offers (worker_id, status);
create index if not exists offers_task_idx          on public.offers (task_id);

drop trigger if exists offers_touch on public.offers;
create trigger offers_touch
  before update on public.offers
  for each row execute function public.touch_updated_at();

-- ============================================================
-- 2. RLS
-- ============================================================

alter table public.offers enable row level security;

drop policy if exists "offers_read_party"    on public.offers;
drop policy if exists "offers_insert_hirer"  on public.offers;
drop policy if exists "offers_update_worker" on public.offers;
drop policy if exists "offers_delete_hirer"  on public.offers;

-- Worker can see their own offers; hirer can see offers on tasks they posted.
create policy "offers_read_party"
  on public.offers for select
  to authenticated
  using (
    worker_id = auth.uid()
    or exists (
      select 1 from public.tasks t
      where t.id = offers.task_id and t.hirer_id = auth.uid()
    )
  );

-- Only the task's hirer can fan-out offers.
create policy "offers_insert_hirer"
  on public.offers for insert
  to authenticated
  with check (
    exists (
      select 1 from public.tasks t
      where t.id = offers.task_id and t.hirer_id = auth.uid()
    )
  );

-- Only the targeted worker can change their own offer status.
create policy "offers_update_worker"
  on public.offers for update
  to authenticated
  using      (worker_id = auth.uid())
  with check (worker_id = auth.uid());

create policy "offers_delete_hirer"
  on public.offers for delete
  to authenticated
  using (
    exists (
      select 1 from public.tasks t
      where t.id = offers.task_id and t.hirer_id = auth.uid()
    )
  );
