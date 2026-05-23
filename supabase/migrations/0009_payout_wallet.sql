-- ChainWork — payout wallet on profiles.
-- The existing wallet_address column captures the sign-in wallet. For LinkedIn
-- (or any non-wallet) users we still need a destination address to send
-- stablecoin payouts to. payout_address + payout_chain hold that explicitly so
-- wallet sign-in identity stays separate from payout routing.
-- Apply via Supabase SQL Editor. Idempotent.

alter table public.profiles add column if not exists payout_address text;
alter table public.profiles add column if not exists payout_chain   text;  -- e.g. 'ethereum' | 'solana' | 'base' | 'polygon' | 'tron'
alter table public.profiles add column if not exists payout_token   text;  -- e.g. 'USDC' | 'USDT' (informational)
