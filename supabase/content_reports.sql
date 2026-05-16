-- ForFuture: Safe Reporting & Fair Moderation
-- Run in Supabase SQL Editor after fix_publish_movement.sql (private.posts must exist).
-- Safe to re-run.

-- =============================================================================
-- 1. Admin flag on profiles (users cannot self-promote)
-- =============================================================================

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create or replace function public.profiles_block_admin_self_update()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is not null then
    if new.is_admin is distinct from old.is_admin then
      raise exception 'Admin status can only be changed by platform administrators';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_block_admin_self_update on public.profiles;
create trigger profiles_block_admin_self_update
  before update on public.profiles
  for each row execute function public.profiles_block_admin_self_update();

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated;

-- =============================================================================
-- 2. content_reports table
-- =============================================================================

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references public.profiles (id) on delete cascade,
  content_type text not null check (content_type in ('movement', 'poll', 'comment')),
  content_id uuid not null,
  report_reason text not null check (
    report_reason in (
      'misinformation',
      'abuse_harassment',
      'hate_discriminatory',
      'spam_scam',
      'privacy_violation',
      'threats_incitement',
      'other'
    )
  ),
  report_note text,
  status text not null default 'submitted' check (
    status in (
      'submitted',
      'under_review',
      'action_taken',
      'no_violation_found',
      'dismissed'
    )
  ),
  priority text not null default 'normal' check (priority in ('high', 'medium', 'normal')),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now(),
  unique (reporter_user_id, content_type, content_id)
);

create index if not exists idx_content_reports_status_priority_created
  on public.content_reports (status, priority, created_at desc);

create index if not exists idx_content_reports_content
  on public.content_reports (content_type, content_id);

create index if not exists idx_content_reports_reporter
  on public.content_reports (reporter_user_id, created_at desc);

-- =============================================================================
-- 3. Triggers: reporter identity, priority (no auto-removal of content)
-- =============================================================================

create or replace function public.content_reports_set_reporter()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required to submit a report';
  end if;
  new.reporter_user_id := auth.uid();
  return new;
end;
$$;

create or replace function public.content_reports_set_priority()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.priority := case new.report_reason
    when 'threats_incitement' then 'high'
    when 'privacy_violation' then 'high'
    when 'spam_scam' then 'high'
    when 'abuse_harassment' then 'medium'
    when 'misinformation' then 'medium'
    else 'normal'
  end;
  return new;
end;
$$;

drop trigger if exists content_reports_set_reporter on public.content_reports;
create trigger content_reports_set_reporter
  before insert on public.content_reports
  for each row execute function public.content_reports_set_reporter();

drop trigger if exists content_reports_set_priority on public.content_reports;
create trigger content_reports_set_priority
  before insert on public.content_reports
  for each row execute function public.content_reports_set_priority();

-- =============================================================================
-- 4. RLS
-- =============================================================================

alter table public.content_reports enable row level security;

drop policy if exists "Users insert own content reports" on public.content_reports;
create policy "Users insert own content reports"
  on public.content_reports for insert to authenticated
  with check (auth.uid() = reporter_user_id);

drop policy if exists "Users read own content reports" on public.content_reports;
create policy "Users read own content reports"
  on public.content_reports for select to authenticated
  using (auth.uid() = reporter_user_id);

drop policy if exists "Admins read all content reports" on public.content_reports;
create policy "Admins read all content reports"
  on public.content_reports for select to authenticated
  using (public.is_platform_admin());

drop policy if exists "Admins update content reports" on public.content_reports;
create policy "Admins update content reports"
  on public.content_reports for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

grant select, insert on public.content_reports to authenticated;

-- =============================================================================
-- 5. Admin moderation RPCs (internal owner fields — never expose publicly)
-- =============================================================================

create or replace function public.admin_get_moderation_queue()
returns table (
  id uuid,
  reporter_user_id uuid,
  content_type text,
  content_id uuid,
  report_reason text,
  report_note text,
  status text,
  priority text,
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz,
  content_report_count bigint,
  high_priority_report_count bigint,
  content_title text,
  content_description text,
  content_movement_type text,
  content_posting_identity text,
  content_youth_voice_id text,
  internal_owner_user_id uuid,
  internal_owner_display_name text,
  internal_owner_youth_voice_id text
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, private
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Forbidden: admin access required';
  end if;

  return query
  select
    cr.id,
    cr.reporter_user_id,
    cr.content_type,
    cr.content_id,
    cr.report_reason,
    cr.report_note,
    cr.status,
    cr.priority,
    cr.admin_note,
    cr.reviewed_by,
    cr.reviewed_at,
    cr.created_at,
    count(*) over (partition by cr.content_type, cr.content_id) as content_report_count,
    count(*) filter (where cr.priority = 'high') over (
      partition by cr.content_type, cr.content_id
    ) as high_priority_report_count,
    p.title as content_title,
    left(coalesce(p.description, ''), 500) as content_description,
    p.movement_type as content_movement_type,
    p.posting_identity as content_posting_identity,
    p.youth_voice_id as content_youth_voice_id,
    p.user_id as internal_owner_user_id,
    owner.display_name as internal_owner_display_name,
    owner.youth_voice_id as internal_owner_youth_voice_id
  from public.content_reports cr
  left join private.posts p
    on p.id = cr.content_id
    and cr.content_type in ('movement', 'poll')
  left join public.profiles owner on owner.id = p.user_id
  order by
    case cr.priority when 'high' then 0 when 'medium' then 1 else 2 end,
    cr.created_at desc;
end;
$$;

create or replace function public.admin_update_content_report(
  p_report_id uuid,
  p_status text,
  p_admin_note text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Forbidden: admin access required';
  end if;

  if p_status not in (
    'submitted', 'under_review', 'action_taken', 'no_violation_found', 'dismissed'
  ) then
    raise exception 'Invalid report status';
  end if;

  update public.content_reports
  set
    status = p_status,
    admin_note = coalesce(p_admin_note, admin_note),
    reviewed_by = auth.uid(),
    reviewed_at = now()
  where id = p_report_id;

  if not found then
    raise exception 'Report not found';
  end if;
end;
$$;

revoke all on function public.admin_get_moderation_queue() from public;
revoke all on function public.admin_update_content_report(uuid, text, text) from public;
grant execute on function public.admin_get_moderation_queue() to authenticated;
grant execute on function public.admin_update_content_report(uuid, text, text) to authenticated;

analyze public.content_reports;

notify pgrst, 'reload schema';
