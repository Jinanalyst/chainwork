-- ChainWork — first-time role selection
-- Tracks WHEN a user has actively chosen their role (hirer / worker / both)
-- so the frontend can show a one-time picker. The 'role' column already
-- exists from 0001_init.sql (default 'both'); we add a timestamp here so we
-- can distinguish "defaulted to both" from "explicitly chose both".
-- Apply via Supabase SQL Editor. Idempotent.

alter table public.profiles add column if not exists role_chosen_at timestamptz;

-- New signups: keep `role` null until the user picks one. Existing rows are
-- left as-is.
alter table public.profiles alter column role drop default;

-- Re-create the auto-create-profile trigger so role is left null on insert.
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
  insert into public.profiles (id, wallet_address, wallet_chain, role)
  values (new.id, addr, chain, null)
  on conflict (id) do nothing;
  return new;
end $$;
