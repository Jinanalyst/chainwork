-- ChainWork — worker profile fields + portfolio + experience tables
-- Adds the columns the ProfileEditor writes to, plus per-row tables for
-- portfolio projects and experience entries. RLS: users CRUD their own rows;
-- everyone authenticated can read (for talent profile pages).
-- Apply via Supabase SQL Editor. Idempotent.

-- ============================================================
-- 1. profiles: editor fields
-- ============================================================

alter table public.profiles add column if not exists title         text;
alter table public.profiles add column if not exists location      text;
alter table public.profiles add column if not exists portfolio_url text;
alter table public.profiles add column if not exists socials       jsonb default '{}'::jsonb;

-- ============================================================
-- 2. portfolio_items
-- ============================================================

create table if not exists public.portfolio_items (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  description  text,
  role         text,
  skills       text[] default '{}',
  url          text,
  proof        jsonb default '[]'::jsonb,    -- [{ id, label, url }]
  media        jsonb default '[]'::jsonb,    -- [{ id, kind, url, name, caption }]
  cover        text,
  position     int  default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists portfolio_items_owner_idx on public.portfolio_items (owner_id, position);

drop trigger if exists portfolio_items_touch on public.portfolio_items;
create trigger portfolio_items_touch
  before update on public.portfolio_items
  for each row execute function public.touch_updated_at();

alter table public.portfolio_items enable row level security;

drop policy if exists "portfolio_read_all"    on public.portfolio_items;
drop policy if exists "portfolio_write_own"   on public.portfolio_items;
drop policy if exists "portfolio_update_own"  on public.portfolio_items;
drop policy if exists "portfolio_delete_own"  on public.portfolio_items;

create policy "portfolio_read_all"
  on public.portfolio_items for select
  to authenticated using (true);

create policy "portfolio_write_own"
  on public.portfolio_items for insert
  to authenticated with check (owner_id = auth.uid());

create policy "portfolio_update_own"
  on public.portfolio_items for update
  to authenticated
  using      (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "portfolio_delete_own"
  on public.portfolio_items for delete
  to authenticated using (owner_id = auth.uid());

-- ============================================================
-- 3. experience_items
-- ============================================================

create table if not exists public.experience_items (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  period       text,
  role         text,
  org          text,
  description  text,
  media        jsonb default '[]'::jsonb,
  position     int  default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists experience_items_owner_idx on public.experience_items (owner_id, position);

drop trigger if exists experience_items_touch on public.experience_items;
create trigger experience_items_touch
  before update on public.experience_items
  for each row execute function public.touch_updated_at();

alter table public.experience_items enable row level security;

drop policy if exists "experience_read_all"    on public.experience_items;
drop policy if exists "experience_write_own"   on public.experience_items;
drop policy if exists "experience_update_own"  on public.experience_items;
drop policy if exists "experience_delete_own"  on public.experience_items;

create policy "experience_read_all"
  on public.experience_items for select
  to authenticated using (true);

create policy "experience_write_own"
  on public.experience_items for insert
  to authenticated with check (owner_id = auth.uid());

create policy "experience_update_own"
  on public.experience_items for update
  to authenticated
  using      (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "experience_delete_own"
  on public.experience_items for delete
  to authenticated using (owner_id = auth.uid());
