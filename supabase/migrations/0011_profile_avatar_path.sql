-- ChainWork — track the storage path of the current avatar so the
-- AvatarUploader can delete the old file when replacing or removing.
-- avatar_url already exists from 0001_init.sql.
-- Apply via Supabase SQL Editor. Idempotent.

alter table public.profiles add column if not exists avatar_storage_path text;
