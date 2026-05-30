-- 0023_drop_paypal_columns.sql
-- Drop the now-dormant PayPal columns from payments. ChainWork pay-in is
-- NOWPayments-only; these columns (and the inline UNIQUE on paypal_order_id)
-- have held no data since the PayPal checkout was removed.
-- Apply via Supabase SQL Editor. Idempotent. Dropping a column also drops its
-- UNIQUE constraint, so no separate constraint drop is needed.

alter table public.payments drop column if exists paypal_capture_id;
alter table public.payments drop column if exists paypal_order_id;
