-- ChainWork — first-time role selection
-- Adds a timestamp so the frontend can show a one-time picker on signup.
-- The 'role' column already exists (default 'both' from 0001_init.sql);
-- we leave that default in place — picker fires when role_chosen_at is null.
-- Apply via Supabase SQL Editor. Idempotent.

alter table public.profiles add column if not exists role_chosen_at timestamptz;
