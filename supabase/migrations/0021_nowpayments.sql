-- 0021_nowpayments.sql
-- Extend the payments table (originally PayPal-only, see 0015_payments.sql) so
-- it can also hold NOWPayments (crypto IPN) rows written by the
-- /api/nowpayments/webhook serverless function using the service-role key.
-- Apply via Supabase SQL Editor. Idempotent.

-- paypal_order_id was NOT NULL UNIQUE. NOWPayments has no PayPal order id, so
-- relax NOT NULL while keeping the existing unique index for PayPal rows.
alter table public.payments alter column paypal_order_id drop not null;

-- Which processor produced this row. Existing rows are PayPal.
alter table public.payments
  add column if not exists provider text not null default 'paypal';

-- NOWPayments payment id — the natural key the webhook upserts on (idempotency).
alter table public.payments
  add column if not exists nowpayments_payment_id text;

create unique index if not exists payments_nowpayments_payment_id_uq
  on public.payments (nowpayments_payment_id)
  where nowpayments_payment_id is not null;

create index if not exists payments_provider_idx on public.payments (provider);

-- NOTE: the status CHECK ('pending','paid','failed','refunded','disputed') is
-- left unchanged. The webhook maps NOWPayments statuses onto this set
-- (waiting/confirming -> pending, finished -> paid, failed -> failed) and keeps
-- the raw NOWPayments status string in metadata.nowpayments_status.
