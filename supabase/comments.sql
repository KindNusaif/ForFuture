-- ForFuture: Discussion comments on public civic movements
-- Run AFTER fix_publish_movement.sql, youth_voice_privacy.sql, content_reports.sql
-- Safe to re-run.

-- =============================================================================
-- 1. Helpers — which posts allow comments (server-side gate)
-- =============================================================================

create or replace function public.post_comments_allowed(p_post_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, public, private
as $$
  select exists (
    select 1
    from public.posts_public_safe p
    where p.id = p_post_id
      and p.posting_identity <> 'youth_voice'
      and p.movement_type in (
        'idea_for_change',
        'raise_voice',
        'peaceful_civic_action',
        'volunteer_drive',
        'quick_youth_poll',
        'youth_petition'
      )
  );
$$;

revoke all on function public.post_comments_allowed(uuid) from public;
revoke all on function public.post_comments_allowed(uuid) from anon;
grant execute on function public.post_comments_allowed(uuid) to anon, authenticated;

-- =============================================================================
-- 2. comments table
-- =============================================================================

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  content_type text not null default 'movement',
  content_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  author_display_name text not null,
  body text not null check (char_length(trim(body)) >= 1 and char_length(body) <= 1000),
  status text not null default 'visible' check (status in ('visible', 'hidden', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_comments_content_created
  on public.comments (content_id, created_at asc)
  where status = 'visible';

create index if not exists idx_comments_user
  on public.comments (user_id, created_at desc);

-- =============================================================================
-- 3. comment_reports table
-- =============================================================================

create table if not exists public.comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (
    reason in (
      'harassment_abuse',
      'hate_offensive',
      'spam',
      'misinformation',
      'other'
    )
  ),
  details text,
  status text not null default 'open' check (
    status in ('open', 'reviewing', 'resolved', 'dismissed')
  ),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (reporter_id, comment_id)
);

create index if not exists idx_comment_reports_status_created
  on public.comment_reports (status, created_at desc);

create index if not exists idx_comment_reports_comment
  on public.comment_reports (comment_id);

-- =============================================================================
-- 4. Triggers
-- =============================================================================

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

  if not public.post_comments_allowed(new.content_id) then
    raise exception 'Comments are not allowed on this content';
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

create or replace function public.comments_touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.comment_reports_set_reporter()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required to report';
  end if;
  new.reporter_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists comments_set_author on public.comments;
create trigger comments_set_author
  before insert on public.comments
  for each row execute function public.comments_set_author();

drop trigger if exists comments_touch_updated_at on public.comments;
create trigger comments_touch_updated_at
  before update on public.comments
  for each row execute function public.comments_touch_updated_at();

drop trigger if exists comment_reports_set_reporter on public.comment_reports;
create trigger comment_reports_set_reporter
  before insert on public.comment_reports
  for each row execute function public.comment_reports_set_reporter();

-- =============================================================================
-- 5. RLS — comments
-- =============================================================================

alter table public.comments enable row level security;

drop policy if exists "Public read visible comments on allowed posts" on public.comments;
create policy "Public read visible comments on allowed posts"
  on public.comments for select
  to anon, authenticated
  using (
    status = 'visible'
    and public.post_comments_allowed(content_id)
  );

drop policy if exists "Authenticated create comments on allowed posts" on public.comments;
create policy "Authenticated create comments on allowed posts"
  on public.comments for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and status = 'visible'
    and public.post_comments_allowed(content_id)
  );

drop policy if exists "Owners update own visible comments" on public.comments;
create policy "Owners update own visible comments"
  on public.comments for update
  to authenticated
  using (auth.uid() = user_id and status = 'visible')
  with check (auth.uid() = user_id and status in ('visible', 'removed'));

drop policy if exists "Owners soft-delete own comments" on public.comments;
-- covered by update policy (status -> removed)

drop policy if exists "Admins moderate comments" on public.comments;
create policy "Admins moderate comments"
  on public.comments for update
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

grant select on public.comments to anon, authenticated;
grant insert, update on public.comments to authenticated;

-- =============================================================================
-- 6. RLS — comment_reports
-- =============================================================================

alter table public.comment_reports enable row level security;

drop policy if exists "Reporters read own comment reports" on public.comment_reports;
create policy "Reporters read own comment reports"
  on public.comment_reports for select
  to authenticated
  using (auth.uid() = reporter_id);

drop policy if exists "Authenticated submit comment reports" on public.comment_reports;
create policy "Authenticated submit comment reports"
  on public.comment_reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

drop policy if exists "Admins read all comment reports" on public.comment_reports;
create policy "Admins read all comment reports"
  on public.comment_reports for select
  to authenticated
  using (public.is_platform_admin());

drop policy if exists "Admins update comment reports" on public.comment_reports;
create policy "Admins update comment reports"
  on public.comment_reports for update
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

grant select, insert on public.comment_reports to authenticated;

-- =============================================================================
-- 7. Admin RPCs — comment moderation queue + actions
-- =============================================================================

create or replace function public.admin_get_comment_moderation_queue()
returns table (
  id uuid,
  reporter_id uuid,
  comment_id uuid,
  reason text,
  details text,
  status text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz,
  comment_body text,
  comment_status text,
  comment_author_display_name text,
  comment_created_at timestamptz,
  content_id uuid,
  content_title text,
  content_movement_type text,
  content_posting_identity text
)
language plpgsql
stable
security invoker
set search_path = pg_catalog, public, private
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Forbidden: admin access required';
  end if;

  return query
  select
    cr.id,
    cr.reporter_id,
    cr.comment_id,
    cr.reason,
    cr.details,
    cr.status,
    cr.reviewed_by,
    cr.reviewed_at,
    cr.created_at,
    left(c.body, 500) as comment_body,
    c.status as comment_status,
    c.author_display_name as comment_author_display_name,
    c.created_at as comment_created_at,
    c.content_id,
    p.title as content_title,
    p.movement_type as content_movement_type,
    p.posting_identity as content_posting_identity
  from public.comment_reports cr
  join public.comments c on c.id = cr.comment_id
  left join private.posts p on p.id = c.content_id
  order by
    case cr.status when 'open' then 0 when 'reviewing' then 1 else 2 end,
    cr.created_at desc;
end;
$$;

create or replace function public.admin_update_comment_report(
  p_report_id uuid,
  p_status text,
  p_comment_status text default null
)
returns void
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_comment_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'Forbidden: admin access required';
  end if;

  if p_status not in ('open', 'reviewing', 'resolved', 'dismissed') then
    raise exception 'Invalid report status';
  end if;

  update public.comment_reports
  set
    status = p_status,
    reviewed_by = auth.uid(),
    reviewed_at = now()
  where id = p_report_id
  returning comment_id into v_comment_id;

  if not found then
    raise exception 'Report not found';
  end if;

  if p_comment_status is not null then
    if p_comment_status not in ('visible', 'hidden', 'removed') then
      raise exception 'Invalid comment status';
    end if;
    update public.comments
    set status = p_comment_status, updated_at = now()
    where id = v_comment_id;
  end if;
end;
$$;

revoke all on function public.admin_get_comment_moderation_queue() from public;
revoke all on function public.admin_get_comment_moderation_queue() from anon;
revoke all on function public.admin_update_comment_report(uuid, text, text) from public;
revoke all on function public.admin_update_comment_report(uuid, text, text) from anon;
grant execute on function public.admin_get_comment_moderation_queue() to authenticated;
grant execute on function public.admin_update_comment_report(uuid, text, text) to authenticated;

analyze public.comments;
analyze public.comment_reports;

notify pgrst, 'reload schema';
