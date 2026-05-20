-- ForFuture: Inspire Hub — youth growth & inspiration posts
-- Run AFTER profiles exist, comments.sql, content_reports.sql
-- Safe to re-run.

-- =============================================================================
-- 1. inspire_posts
-- =============================================================================

create table if not exists public.inspire_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null check (
    category in (
      'achievement',
      'success_story',
      'motivation',
      'entrepreneurship',
      'innovation',
      'book_idea'
    )
  ),
  title text not null check (
    char_length(trim(title)) >= 3 and char_length(title) <= 200
  ),
  body text not null check (
    char_length(trim(body)) >= 10 and char_length(body) <= 8000
  ),
  field_data jsonb not null default '{}'::jsonb,
  could_become_movement boolean not null default false,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_inspire_posts_category_created
  on public.inspire_posts (category, created_at desc)
  where status = 'visible';

create index if not exists idx_inspire_posts_user_created
  on public.inspire_posts (user_id, created_at desc);

-- =============================================================================
-- 2. inspire_saved (bookmarks)
-- =============================================================================

create table if not exists public.inspire_saved (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  inspire_post_id uuid not null references public.inspire_posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, inspire_post_id)
);

create index if not exists idx_inspire_saved_user
  on public.inspire_saved (user_id, created_at desc);

-- =============================================================================
-- 3. updated_at trigger
-- =============================================================================

create or replace function public.inspire_posts_set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists inspire_posts_set_updated_at on public.inspire_posts;
create trigger inspire_posts_set_updated_at
  before update on public.inspire_posts
  for each row execute function public.inspire_posts_set_updated_at();

-- =============================================================================
-- 4. Comment gate for inspire posts
-- =============================================================================

create or replace function public.inspire_comments_allowed(p_inspire_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.inspire_posts p
    where p.id = p_inspire_id
      and p.status = 'visible'
  );
$$;

revoke all on function public.inspire_comments_allowed(uuid) from public;
grant execute on function public.inspire_comments_allowed(uuid) to anon, authenticated;

-- Extend comments insert trigger for inspire content_type
create or replace function public.comments_set_author()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  profile_name text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required to comment';
  end if;

  if coalesce(new.content_type, 'movement') = 'inspire' then
    if not public.inspire_comments_allowed(new.content_id) then
      raise exception 'Comments are not allowed on this content';
    end if;
  else
    if not public.post_comments_allowed(new.content_id) then
      raise exception 'Comments are not allowed on this content';
    end if;
  end if;

  new.user_id := auth.uid();
  new.updated_at := now();

  select p.display_name into profile_name
  from public.profiles p
  where p.id = auth.uid();

  new.author_display_name := coalesce(nullif(trim(profile_name), ''), 'Community member');
  return new;
end;
$$;

-- =============================================================================
-- 5. RLS — inspire_posts
-- =============================================================================

alter table public.inspire_posts enable row level security;

drop policy if exists inspire_posts_select_visible on public.inspire_posts;
create policy inspire_posts_select_visible
  on public.inspire_posts
  for select
  using (status = 'visible');

drop policy if exists inspire_posts_insert_own on public.inspire_posts;
create policy inspire_posts_insert_own
  on public.inspire_posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists inspire_posts_update_own on public.inspire_posts;
create policy inspire_posts_update_own
  on public.inspire_posts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists inspire_posts_delete_own on public.inspire_posts;
create policy inspire_posts_delete_own
  on public.inspire_posts
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Admin read/update all visible/hidden for moderation (if is_platform_admin exists)
drop policy if exists inspire_posts_admin_all on public.inspire_posts;
create policy inspire_posts_admin_all
  on public.inspire_posts
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

grant select on public.inspire_posts to anon, authenticated;
grant insert, update, delete on public.inspire_posts to authenticated;

-- =============================================================================
-- 6. RLS — inspire_saved
-- =============================================================================

alter table public.inspire_saved enable row level security;

drop policy if exists inspire_saved_select_own on public.inspire_saved;
create policy inspire_saved_select_own
  on public.inspire_saved
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists inspire_saved_insert_own on public.inspire_saved;
create policy inspire_saved_insert_own
  on public.inspire_saved
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists inspire_saved_delete_own on public.inspire_saved;
create policy inspire_saved_delete_own
  on public.inspire_saved
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.inspire_saved to authenticated;

-- =============================================================================
-- 7. Extend content_reports for inspire
-- =============================================================================

alter table public.content_reports
  drop constraint if exists content_reports_content_type_check;

alter table public.content_reports
  add constraint content_reports_content_type_check check (
    content_type in (
      'movement',
      'poll',
      'petition',
      'volunteer_drive',
      'fundraising',
      'campaign',
      'relief',
      'comment',
      'inspire'
    )
  );

notify pgrst, 'reload schema';
