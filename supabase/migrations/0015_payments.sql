-- 0015_payments.sql
-- Payment records for ChainWork PayPal (sandbox + live) checkout.
-- Written by the /api/paypal/* serverless functions using the service-role key.

create table if not exists public.payments (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete set null,
  paypal_order_id   text not null unique,
  paypal_capture_id text,
  payment_type      text not null,
  amount            numeric(14,2),
  currency          text,
  status            text not null default 'pending'
                      check (status in ('pending','paid','failed','refunded','disputed')),
  metadata          jsonb default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists payments_user_id_idx     on public.payments (user_id);
create index if not exists payments_status_idx      on public.payments (status);
create index if not exists payments_created_at_idx  on public.payments (created_at desc);

-- Auto-bump updated_at on writes
create or replace function public.payments_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists payments_touch_updated_at on public.payments;
create trigger payments_touch_updated_at
  before update on public.payments
  for each row execute function public.payments_touch_updated_at();

-- Row Level Security: only the owning user can read their payment records.
-- The service-role key (used by API routes) bypasses RLS so writes still work.
alter table public.payments enable row level security;

drop policy if exists "payments_self_read" on public.payments;
create policy "payments_self_read"
  on public.payments for select
  using (auth.uid() = user_id);

-- No insert/update/delete policies — those are server-only via service role.
