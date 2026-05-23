-- Live chat tables for ChainWork.
--
-- A "thread" is one chat room per task. Two roles drop into it: the hirer
-- and the worker (identified by wallet address from the Supabase Web3 JWT).
-- Messages are realtime-broadcast via the supabase_realtime publication.
--
-- RLS model (MVP): any authenticated user can read threads/messages; inserts
-- require sender_wallet to match the JWT-derived wallet. Tighten later to
-- restrict reads to the hirer/worker on a per-task basis if needed.

create extension if not exists pgcrypto;

-- Derive the caller's wallet from the Supabase Web3 JWT metadata,
-- with a fallback to auth.uid() so non-Web3 sign-ins still work.
create or replace function public.current_wallet() returns text
  language sql stable as $$
  select coalesce(
    nullif(auth.jwt() -> 'user_metadata' ->> 'wallet_address', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'address', ''),
    auth.uid()::text
  );
$$;

create table if not exists public.chat_threads (
  id            uuid primary key default gen_random_uuid(),
  task_id       text not null unique,
  hirer_wallet  text,
  worker_wallet text,
  created_at    timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id            uuid primary key default gen_random_uuid(),
  thread_id     uuid not null references public.chat_threads(id) on delete cascade,
  sender_wallet text not null,
  sender_name   text,
  body          text not null,
  created_at    timestamptz not null default now()
);

create index if not exists chat_messages_thread_created_idx
  on public.chat_messages (thread_id, created_at);

alter table public.chat_threads  enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists chat_threads_read   on public.chat_threads;
drop policy if exists chat_threads_write  on public.chat_threads;
drop policy if exists chat_threads_update on public.chat_threads;
drop policy if exists chat_messages_read  on public.chat_messages;
drop policy if exists chat_messages_write on public.chat_messages;

create policy chat_threads_read on public.chat_threads
  for select to authenticated using (true);

create policy chat_threads_write on public.chat_threads
  for insert to authenticated with check (true);

create policy chat_threads_update on public.chat_threads
  for update to authenticated using (true) with check (true);

create policy chat_messages_read on public.chat_messages
  for select to authenticated using (true);

create policy chat_messages_write on public.chat_messages
  for insert to authenticated
  with check (sender_wallet = public.current_wallet());

-- Realtime: stream message inserts to clients subscribed via channel().
do $$ begin
  perform 1 from pg_publication where pubname = 'supabase_realtime';
  if found then
    begin
      alter publication supabase_realtime add table public.chat_messages;
    exception when duplicate_object then null; end;
    begin
      alter publication supabase_realtime add table public.chat_threads;
    exception when duplicate_object then null; end;
  end if;
end $$;
