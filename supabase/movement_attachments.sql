-- ForFuture: movement media attachments (images + PDFs; video-ready schema)
-- Run after fix_database.sql
-- Also create storage buckets in Dashboard or via statements below.

-- =============================================================================
-- 1. Storage buckets
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('movement-images', 'movement-images', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('movement-documents', 'movement-documents', true)
on conflict (id) do update set public = true;

-- =============================================================================
-- 2. movement_attachments table
-- =============================================================================

create table if not exists public.movement_attachments (
  id uuid primary key default gen_random_uuid(),
  movement_id uuid not null references private.posts (id) on delete cascade,
  uploader_id uuid not null references public.profiles (id) on delete cascade,
  file_type text not null check (file_type in ('image', 'document')),
  media_kind text not null default 'image' check (media_kind in ('image', 'document', 'video')),
  mime_type text not null,
  storage_bucket text not null,
  storage_path text not null,
  original_file_name text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0 and file_size_bytes <= 10485760),
  display_order smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create index if not exists idx_movement_attachments_movement_id
  on public.movement_attachments (movement_id);

create index if not exists idx_movement_attachments_uploader_id
  on public.movement_attachments (uploader_id);

create index if not exists idx_movement_attachments_file_type
  on public.movement_attachments (file_type);

create index if not exists idx_movement_attachments_created_at
  on public.movement_attachments (created_at desc);

-- =============================================================================
-- 3. RLS — movement_attachments
-- =============================================================================

alter table public.movement_attachments enable row level security;

drop policy if exists "Movement attachments are publicly readable" on public.movement_attachments;
create policy "Movement attachments are publicly readable"
  on public.movement_attachments for select
  to anon, authenticated
  using (true);

drop policy if exists "Users insert attachments for own movements" on public.movement_attachments;
create policy "Users insert attachments for own movements"
  on public.movement_attachments for insert
  to authenticated
  with check (
    uploader_id = auth.uid()
    and exists (
      select 1 from private.posts p
      where p.id = movement_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "Users delete own attachments" on public.movement_attachments;
create policy "Users delete own attachments"
  on public.movement_attachments for delete
  to authenticated
  using (uploader_id = auth.uid());

grant select on public.movement_attachments to anon, authenticated;
grant insert, delete on public.movement_attachments to authenticated;

-- =============================================================================
-- 4. Storage policies — path: {userId}/{movementId}/{filename}
-- =============================================================================

drop policy if exists "Public read movement images" on storage.objects;
create policy "Public read movement images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'movement-images');

drop policy if exists "Authenticated upload movement images" on storage.objects;
create policy "Authenticated upload movement images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'movement-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owners delete movement images" on storage.objects;
create policy "Owners delete movement images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'movement-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Public read movement documents" on storage.objects;
create policy "Public read movement documents"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'movement-documents');

drop policy if exists "Authenticated upload movement documents" on storage.objects;
create policy "Authenticated upload movement documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'movement-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owners delete movement documents" on storage.objects;
create policy "Owners delete movement documents"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'movement-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

grant select on storage.objects to anon, authenticated;
grant insert, delete on storage.objects to authenticated;

notify pgrst, 'reload schema';
