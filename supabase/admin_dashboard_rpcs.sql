-- ForFuture Admin Dashboard — read-only stats & listings (security definer, admin-only)
-- Run in Supabase SQL Editor after public_beta_rls.sql / is_platform_admin() exists.
-- Safe to re-run.

-- =============================================================================
-- Platform stats (overview cards)
-- =============================================================================

create or replace function public.admin_get_platform_stats()
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  v_users bigint := 0;
  v_posts bigint := 0;
  v_petitions bigint := 0;
  v_polls bigint := 0;
  v_volunteer bigint := 0;
  v_reports bigint := 0;
begin
  if not public.is_platform_admin() then
    raise exception 'Admin access required';
  end if;

  select count(*)::bigint into v_users from public.profiles;

  if exists (select 1 from pg_tables where schemaname = 'private' and tablename = 'posts') then
    select count(*)::bigint into v_posts from private.posts;
    select count(*)::bigint into v_petitions
      from private.posts where movement_type in ('petition', 'youth_petition');
    select count(*)::bigint into v_polls
      from private.posts where movement_type in ('poll', 'community_poll');
    select count(*)::bigint into v_volunteer
      from private.posts where movement_type in ('volunteer', 'volunteer_drive');
  elsif exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'posts') then
    select count(*)::bigint into v_posts from public.posts;
    select count(*)::bigint into v_petitions
      from public.posts where movement_type in ('petition', 'youth_petition');
    select count(*)::bigint into v_polls
      from public.posts where movement_type in ('poll', 'community_poll');
    select count(*)::bigint into v_volunteer
      from public.posts where movement_type in ('volunteer', 'volunteer_drive');
  end if;

  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'content_reports') then
    select count(*)::bigint into v_reports
      from public.content_reports
      where status in ('submitted', 'under_review');
  end if;

  return jsonb_build_object(
    'total_users', v_users,
    'total_posts', v_posts,
    'total_petitions', v_petitions,
    'total_polls', v_polls,
    'total_volunteer_drives', v_volunteer,
    'total_reports_pending', v_reports
  );
end;
$$;

revoke all on function public.admin_get_platform_stats() from public;
revoke all on function public.admin_get_platform_stats() from anon;
grant execute on function public.admin_get_platform_stats() to authenticated;

-- =============================================================================
-- Profile listing (users page — no auth.users email exposure)
-- =============================================================================

create or replace function public.admin_list_profiles(
  p_search text default '',
  p_limit int default 50,
  p_offset int default 0
)
returns table (
  id uuid,
  display_name text,
  youth_voice_id text,
  is_admin boolean,
  is_verified_organizer boolean,
  created_at timestamptz
)
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Admin access required';
  end if;

  p_limit := least(greatest(coalesce(p_limit, 50), 1), 100);
  p_offset := greatest(coalesce(p_offset, 0), 0);

  return query
  select
    p.id,
    p.display_name,
    p.youth_voice_id,
    coalesce(p.is_admin, false),
    coalesce(p.is_verified_organizer, false),
    p.created_at
  from public.profiles p
  where coalesce(trim(p_search), '') = ''
     or p.display_name ilike '%' || trim(p_search) || '%'
     or p.youth_voice_id ilike '%' || trim(p_search) || '%'
     or p.id::text = trim(p_search)
  order by p.created_at desc nulls last
  limit p_limit
  offset p_offset;
end;
$$;

revoke all on function public.admin_list_profiles(text, int, int) from public;
revoke all on function public.admin_list_profiles(text, int, int) from anon;
grant execute on function public.admin_list_profiles(text, int, int) to authenticated;

-- =============================================================================
-- Recent activity feed (overview)
-- =============================================================================

create or replace function public.admin_get_recent_activity(p_limit int default 10)
returns table (
  activity_type text,
  activity_id uuid,
  title text,
  created_at timestamptz
)
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Admin access required';
  end if;

  p_limit := least(greatest(coalesce(p_limit, 10), 1), 20);

  return query
  (
    select
      'user'::text,
      p.id,
      coalesce(nullif(trim(p.display_name), ''), 'New user'),
      p.created_at
    from public.profiles p
    order by p.created_at desc
    limit p_limit
  )
  union all
  (
    select
      'post'::text,
      po.id,
      coalesce(nullif(trim(po.title), ''), 'Untitled post'),
      po.created_at
    from private.posts po
    order by po.created_at desc
    limit p_limit
  )
  order by created_at desc
  limit p_limit;
exception
  when undefined_table then
    return query
    select
      'user'::text,
      p.id,
      coalesce(nullif(trim(p.display_name), ''), 'New user'),
      p.created_at
    from public.profiles p
    order by p.created_at desc
    limit p_limit;
end;
$$;

revoke all on function public.admin_get_recent_activity(int) from public;
revoke all on function public.admin_get_recent_activity(int) from anon;
grant execute on function public.admin_get_recent_activity(int) to authenticated;
