-- ChainWork — Storage bucket for portfolio + experience media.
-- Files live at: portfolio-media/{owner_uid}/{file-id}.{ext}
-- RLS: anyone authenticated can read; the owner is the only one who can
-- write / update / delete files under their own uid prefix.
-- Apply via Supabase SQL Editor. Idempotent.

-- ============================================================
-- 1. Bucket
-- ============================================================

insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do update set public = excluded.public;

-- ============================================================
-- 2. Policies on storage.objects, scoped to this bucket
-- ============================================================

drop policy if exists "portfolio_media_read"   on storage.objects;
drop policy if exists "portfolio_media_insert" on storage.objects;
drop policy if exists "portfolio_media_update" on storage.objects;
drop policy if exists "portfolio_media_delete" on storage.objects;

-- Read: anyone authenticated (the bucket is also public-read for the URL).
create policy "portfolio_media_read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'portfolio-media');

-- Write/update/delete: object name MUST start with "{auth.uid()}/".
create policy "portfolio_media_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'portfolio-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "portfolio_media_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'portfolio-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'portfolio-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "portfolio_media_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'portfolio-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
