-- ChainWork — initial schema
-- Apply via: Supabase Dashboard → SQL Editor → New query → paste → Run
-- Idempotent: safe to re-run.

-- ============================================================
-- 1. Profiles  (one row per auth.users)
-- ============================================================

create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  company         text,
  bio             text,
  contact_email   text,
  wallet_address  text,
  wallet_chain    text,                              -- 'ethereum' | 'solana'
  role            text default 'both',               -- 'hirer' | 'worker' | 'both'
  avatar_url      text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists profiles_wallet_idx on public.profiles (wallet_address);

-- ============================================================
-- 2. Tasks
-- ============================================================

create table if not exists public.tasks (
  id               uuid primary key default gen_random_uuid(),
  hirer_id         uuid not null references public.profiles(id) on delete cascade,
  talent_id        uuid          references public.profiles(id) on delete set null,
  title            text not null,
  description      text,
  category         text,                                -- 'web-build' | 'web-fix' | 'ai-automation' | 'web3' | 'app-pwa' | 'digital-support'
  skills           text[] default '{}',
  budget_cents     bigint,
  budget_currency  text default 'USD',
  url              text,
  status           text default 'open',                 -- 'open' | 'in_escrow' | 'in_progress' | 'awaiting_review' | 'completed' | 'disputed' | 'cancelled'
  deadline         date,
  progress         int  default 0 check (progress between 0 and 100),
  last_activity_at timestamptz default now(),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists tasks_hirer_idx        on public.tasks (hirer_id);
create index if not exists tasks_talent_idx       on public.tasks (talent_id);
create index if not exists tasks_status_idx       on public.tasks (status);
create index if not exists tasks_last_activity_ix on public.tasks (last_activity_at desc);

-- ============================================================
-- 3. Attachments
-- ============================================================

create table if not exists public.task_attachments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  label       text not null,
  url         text,
  added_by    uuid          references public.profiles(id) on delete set null,
  created_at  timestamptz default now()
);

create index if not exists task_attachments_task_idx on public.task_attachments (task_id);

-- ============================================================
-- 4. Timeline events  (status changes, milestones, etc.)
-- ============================================================

create table if not exists public.task_timeline (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  label       text not null,
  by_id       uuid          references public.profiles(id) on delete set null,
  by_name     text,                                  -- snapshot of name at time of event
  created_at  timestamptz default now()
);

create index if not exists task_timeline_task_idx on public.task_timeline (task_id, created_at);

-- ============================================================
-- 5. Notes  (threaded comments between hirer & talent)
-- ============================================================

create table if not exists public.task_notes (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz default now()
);

create index if not exists task_notes_task_idx on public.task_notes (task_id, created_at);

-- ============================================================
-- 6. Triggers
-- ============================================================

-- generic updated_at touch
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists tasks_touch on public.tasks;
create trigger tasks_touch
  before update on public.tasks
  for each row execute function public.touch_updated_at();

-- auto-create profile on signup (wallet auth puts address in user_metadata)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  addr  text;
  chain text;
begin
  addr  := coalesce(
            new.raw_user_meta_data ->> 'wallet_address',
            new.raw_user_meta_data ->> 'address',
            new.raw_user_meta_data ->> 'sub'
          );
  chain := coalesce(
            new.raw_user_meta_data ->> 'chain',
            new.raw_user_meta_data ->> 'wallet_chain'
          );
  insert into public.profiles (id, wallet_address, wallet_chain)
  values (new.id, addr, chain)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- bump tasks.last_activity_at when a note or timeline event lands
create or replace function public.bump_task_activity()
returns trigger language plpgsql as $$
begin
  update public.tasks set last_activity_at = now() where id = new.task_id;
  return new;
end $$;

drop trigger if exists notes_bump_activity on public.task_notes;
create trigger notes_bump_activity
  after insert on public.task_notes
  for each row execute function public.bump_task_activity();

drop trigger if exists timeline_bump_activity on public.task_timeline;
create trigger timeline_bump_activity
  after insert on public.task_timeline
  for each row execute function public.bump_task_activity();

-- ============================================================
-- 7. RLS — enable
-- ============================================================

alter table public.profiles         enable row level security;
alter table public.tasks            enable row level security;
alter table public.task_attachments enable row level security;
alter table public.task_timeline    enable row level security;
alter table public.task_notes       enable row level security;

-- ============================================================
-- 8. Helper: is current user a party on a task?
--    SECURITY DEFINER so it can see the task without recursing
--    into the tasks RLS policy.
-- ============================================================

create or replace function public.is_task_party(t uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tasks
    where id = t and (hirer_id = auth.uid() or talent_id = auth.uid())
  );
$$;

grant execute on function public.is_task_party(uuid) to authenticated;

-- ============================================================
-- 9. RLS policies
-- ============================================================

-- profiles — readable by any signed-in user, writable by owner
drop policy if exists "profiles_read"        on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
drop policy if exists "profiles_self_insert" on public.profiles;

create policy "profiles_read"
  on public.profiles for select
  to authenticated using (true);

create policy "profiles_self_update"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_self_insert"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- tasks — hirer or talent can see; open tasks visible to all authed
drop policy if exists "tasks_read_parties"    on public.tasks;
drop policy if exists "tasks_insert_hirer"    on public.tasks;
drop policy if exists "tasks_update_parties"  on public.tasks;
drop policy if exists "tasks_delete_hirer"    on public.tasks;

create policy "tasks_read_parties"
  on public.tasks for select
  to authenticated
  using (
    hirer_id  = auth.uid()
    or talent_id = auth.uid()
    or status  = 'open'
  );

create policy "tasks_insert_hirer"
  on public.tasks for insert
  to authenticated
  with check (hirer_id = auth.uid());

create policy "tasks_update_parties"
  on public.tasks for update
  to authenticated
  using      (hirer_id = auth.uid() or talent_id = auth.uid())
  with check (hirer_id = auth.uid() or talent_id = auth.uid());

create policy "tasks_delete_hirer"
  on public.tasks for delete
  to authenticated
  using (hirer_id = auth.uid());

-- attachments / timeline / notes — parties only
drop policy if exists "attachments_read"   on public.task_attachments;
drop policy if exists "attachments_write"  on public.task_attachments;
drop policy if exists "attachments_delete" on public.task_attachments;

create policy "attachments_read"
  on public.task_attachments for select
  to authenticated using (public.is_task_party(task_id));

create policy "attachments_write"
  on public.task_attachments for insert
  to authenticated with check (public.is_task_party(task_id));

create policy "attachments_delete"
  on public.task_attachments for delete
  to authenticated using (public.is_task_party(task_id));

drop policy if exists "timeline_read"  on public.task_timeline;
drop policy if exists "timeline_write" on public.task_timeline;

create policy "timeline_read"
  on public.task_timeline for select
  to authenticated using (public.is_task_party(task_id));

create policy "timeline_write"
  on public.task_timeline for insert
  to authenticated with check (public.is_task_party(task_id));

drop policy if exists "notes_read"        on public.task_notes;
drop policy if exists "notes_write"       on public.task_notes;
drop policy if exists "notes_delete_self" on public.task_notes;

create policy "notes_read"
  on public.task_notes for select
  to authenticated using (public.is_task_party(task_id));

create policy "notes_write"
  on public.task_notes for insert
  to authenticated
  with check (public.is_task_party(task_id) and author_id = auth.uid());

create policy "notes_delete_self"
  on public.task_notes for delete
  to authenticated using (author_id = auth.uid());

-- ============================================================
-- 10. Realtime
-- ============================================================

-- Add tables to the supabase_realtime publication (re-run safe).
do $$
begin
  begin alter publication supabase_realtime add table public.tasks;          exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.task_notes;     exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.task_timeline;  exception when duplicate_object then null; end;
end $$;
