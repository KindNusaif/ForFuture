-- ForFuture: Trust & Verification System (production-safe, idempotent)
-- Run in Supabase SQL Editor after fix_database.sql / content_reports.sql
--
-- Separates:
--   • Organizer verification (profiles)
--   • Campaign review (private.posts)
--
-- Requires: public.is_platform_admin() from content_reports.sql

-- =============================================================================
-- 1. profiles — verified organizer
-- =============================================================================

alter table public.profiles
  add column if not exists is_verified_organizer boolean not null default false;

alter table public.profiles
  add column if not exists organizer_verification_type text;

alter table public.profiles
  add column if not exists organizer_verified_at timestamptz;

alter table public.profiles drop constraint if exists profiles_organizer_verification_type_check;
alter table public.profiles add constraint profiles_organizer_verification_type_check check (
  organizer_verification_type is null
  or organizer_verification_type in (
    'organization', 'ngo', 'student_society', 'community_partner'
  )
);

-- Migrate from legacy columns if present
update public.profiles
set
  is_verified_organizer = coalesce(is_verified_organizer, is_verified_organization, false),
  organizer_verification_type = coalesce(
    organizer_verification_type,
    case organization_verification_type
      when 'official_organization' then 'organization'
      when 'ngo' then 'ngo'
      when 'student_society' then 'student_society'
      when 'community_partner' then 'community_partner'
      else null
    end
  ),
  organizer_verified_at = coalesce(organizer_verified_at, verified_at)
where is_verified_organization = true
   or is_verified_organizer = true
   or organizer_verification_type is not null;

-- =============================================================================
-- 2. private.posts — campaign review
-- =============================================================================

alter table private.posts
  add column if not exists review_status text not null default 'unreviewed';

alter table private.posts
  add column if not exists reviewed_campaign_type text;

alter table private.posts
  add column if not exists reviewed_at timestamptz;

alter table private.posts
  add column if not exists reviewed_by uuid references public.profiles (id);

alter table private.posts
  add column if not exists review_note text;

alter table private.posts drop constraint if exists posts_review_status_check;
alter table private.posts add constraint posts_review_status_check check (
  review_status in ('unreviewed', 'under_review', 'reviewed', 'rejected')
);

alter table private.posts drop constraint if exists posts_reviewed_campaign_type_check;
alter table private.posts add constraint posts_reviewed_campaign_type_check check (
  reviewed_campaign_type is null
  or reviewed_campaign_type in (
    'fundraising', 'volunteer_drive', 'civic_campaign', 'petition', 'general_campaign'
  )
);

-- Migrate from legacy trusted flags
update private.posts
set
  review_status = case
    when is_trusted_campaign = true and review_status = 'unreviewed' then 'reviewed'
    else review_status
  end,
  reviewed_campaign_type = coalesce(
    reviewed_campaign_type,
    case trusted_campaign_type
      when 'civic_action' then 'civic_campaign'
      when 'petition' then 'petition'
      when 'fundraising' then 'fundraising'
      when 'volunteer_drive' then 'volunteer_drive'
      when 'general_campaign' then 'general_campaign'
      else null
    end,
    case movement_type
      when 'fundraising' then 'fundraising'
      when 'volunteer_drive' then 'volunteer_drive'
      when 'peaceful_civic_action' then 'civic_campaign'
      when 'youth_petition' then 'petition'
      else null
    end
  ),
  reviewed_at = coalesce(reviewed_at, trusted_at)
where is_trusted_campaign = true;

create index if not exists idx_posts_review_status on private.posts (review_status);

-- =============================================================================
-- 3. Block self-service trust changes
-- =============================================================================

create or replace function public.profiles_block_organizer_verification_self_update()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is not null then
    if new.is_verified_organizer is distinct from old.is_verified_organizer
       or new.organizer_verification_type is distinct from old.organizer_verification_type
       or new.organizer_verified_at is distinct from old.organizer_verified_at then
      raise exception 'Organizer verification can only be changed by platform administrators';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.posts_block_review_self_update()
returns trigger
language plpgsql
set search_path = pg_catalog, private, public
as $$
begin
  if auth.uid() is not null then
    if new.review_status is distinct from old.review_status
       or new.reviewed_campaign_type is distinct from old.reviewed_campaign_type
       or new.reviewed_at is distinct from old.reviewed_at
       or new.reviewed_by is distinct from old.reviewed_by
       or new.review_note is distinct from old.review_note then
      raise exception 'Campaign review status can only be changed by platform administrators';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_block_organizer_verification_self_update on public.profiles;
create trigger profiles_block_organizer_verification_self_update
  before update on public.profiles
  for each row execute function public.profiles_block_organizer_verification_self_update();

drop trigger if exists posts_block_review_self_update on private.posts;
create trigger posts_block_review_self_update
  before update on private.posts
  for each row execute function public.posts_block_review_self_update();

-- Keep legacy triggers in sync (block old column self-updates too)
drop trigger if exists profiles_block_verification_self_update on public.profiles;
create trigger profiles_block_verification_self_update
  before update on public.profiles
  for each row execute function public.profiles_block_organizer_verification_self_update();

drop trigger if exists posts_block_trusted_self_update on private.posts;
create trigger posts_block_trusted_self_update
  before update on private.posts
  for each row execute function public.posts_block_review_self_update();

-- =============================================================================
-- 4. RLS — public read of verified organizer flags (for feed badges)
-- =============================================================================

drop policy if exists "Public can read verified organization flags" on public.profiles;
drop policy if exists "Public can read verified organizer flags" on public.profiles;
create policy "Public can read verified organizer flags"
  on public.profiles for select
  to anon, authenticated
  using (is_verified_organizer = true);

-- =============================================================================
-- 5. Refresh posts_public_safe
-- =============================================================================

do $$
begin
  if exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'posts_public_safe' and c.relkind = 'v'
  ) then
    execute 'drop view public.posts_public_safe';
  end if;
end;
$$;

create view public.posts_public_safe
with (security_invoker = true)
as
select
  p.id,
  case when p.posting_identity = 'youth_voice' then null::uuid else p.user_id end as user_id,
  p.title,
  p.description,
  p.category,
  p.created_at,
  p.posting_identity,
  case
    when p.posting_identity = 'youth_voice' and p.youth_voice_id is not null then
      'Youth Voice ' || p.youth_voice_id
    else
      p.author_name
  end as author_name,
  case when p.posting_identity = 'youth_voice' then p.youth_voice_id else null end as youth_voice_id,
  p.movement_type,
  p.proposed_solution, p.expected_impact, p.issue_summary, p.desired_change,
  p.event_date, p.event_time, p.location, p.volunteer_slots, p.contact_note,
  p.fundraising_goal_amount, p.fundraising_purpose, p.beneficiary_description, p.current_raised_amount,
  p.action_date, p.action_time, p.action_location, p.action_purpose, p.safety_note,
  p.petition_issue, p.petition_requested_change, p.petition_target_authority,
  p.petition_support_goal, p.petition_closing_date, p.petition_impact_note,
  p.location_name, p.latitude, p.longitude,
  p.review_status,
  p.reviewed_campaign_type,
  p.reviewed_at,
  (p.review_status = 'reviewed') as is_trusted_campaign,
  case p.reviewed_campaign_type
    when 'civic_campaign' then 'civic_action'
    else p.reviewed_campaign_type
  end as trusted_campaign_type,
  p.reviewed_at as trusted_at,
  case
    when p.posting_identity = 'youth_voice' then false
    else coalesce(pr.is_verified_organizer, pr.is_verified_organization, false)
  end as author_is_verified_organization,
  case
    when p.posting_identity = 'youth_voice' then false
    else coalesce(pr.is_verified_organizer, pr.is_verified_organization, false)
  end as author_is_verified_organizer,
  case
    when p.posting_identity = 'youth_voice' then null::text
    else coalesce(
      pr.organizer_verification_type,
      case pr.organization_verification_type
        when 'official_organization' then 'organization'
        when 'ngo' then 'ngo'
        when 'student_society' then 'student_society'
        when 'community_partner' then 'community_partner'
        else null
      end
    )
  end as author_organization_verification_type,
  case
    when p.posting_identity = 'youth_voice' then null::text
    else coalesce(
      pr.organizer_verification_type,
      case pr.organization_verification_type
        when 'official_organization' then 'organization'
        else pr.organization_verification_type
      end
    )
  end as author_organizer_verification_type
from private.posts p
left join public.profiles pr
  on pr.id = p.user_id and p.posting_identity <> 'youth_voice';

grant select on public.posts_public_safe to anon, authenticated;

-- =============================================================================
-- 6. Admin RPCs
-- =============================================================================

create or replace function public.admin_search_profiles_for_trust(p_query text default '')
returns table (
  id uuid,
  display_name text,
  youth_voice_id text,
  is_verified_organizer boolean,
  organizer_verification_type text,
  organizer_verified_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  select
    p.id,
    p.display_name,
    p.youth_voice_id,
    p.is_verified_organizer,
    p.organizer_verification_type,
    p.organizer_verified_at
  from public.profiles p
  where p_query is null
     or trim(p_query) = ''
     or p.display_name ilike '%' || trim(p_query) || '%'
     or p.youth_voice_id ilike '%' || trim(p_query) || '%'
     or p.id::text = trim(p_query)
  order by p.display_name
  limit 40;
end;
$$;

create or replace function public.admin_update_organizer_verification(
  p_profile_id uuid,
  p_is_verified boolean,
  p_verification_type text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Admin access required';
  end if;

  if p_is_verified and p_verification_type is null then
    raise exception 'Verification type is required when verifying an organizer';
  end if;

  update public.profiles
  set
    is_verified_organizer = p_is_verified,
    organizer_verification_type = case when p_is_verified then p_verification_type else null end,
    organizer_verified_at = case when p_is_verified then now() else null end,
    is_verified_organization = p_is_verified,
    organization_verification_type = case
      when not p_is_verified then null
      when p_verification_type = 'organization' then 'official_organization'
      when p_verification_type = 'ngo' then 'ngo'
      when p_verification_type = 'student_society' then 'student_society'
      when p_verification_type = 'community_partner' then 'community_partner'
      else null
    end,
    verified_at = case when p_is_verified then now() else null end
  where id = p_profile_id;

  if not found then
    raise exception 'Profile not found';
  end if;
end;
$$;

create or replace function public.admin_get_campaign_review_queue(
  p_status text default null,
  p_movement_type text default null
)
returns table (
  post_id uuid,
  title text,
  movement_type text,
  posting_identity text,
  youth_voice_id text,
  author_name text,
  review_status text,
  reviewed_campaign_type text,
  reviewed_at timestamptz,
  review_note text,
  owner_user_id uuid,
  owner_display_name text,
  owner_youth_voice_id text,
  owner_is_verified_organizer boolean
)
language plpgsql
security definer
set search_path = pg_catalog, private, public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  select
    p.id as post_id,
    p.title,
    p.movement_type,
    p.posting_identity,
    p.youth_voice_id,
    p.author_name,
    p.review_status,
    p.reviewed_campaign_type,
    p.reviewed_at,
    p.review_note,
    p.user_id as owner_user_id,
    pr.display_name as owner_display_name,
    pr.youth_voice_id as owner_youth_voice_id,
    coalesce(pr.is_verified_organizer, false) as owner_is_verified_organizer
  from private.posts p
  left join public.profiles pr on pr.id = p.user_id
  where (p_status is null or p.review_status = p_status)
    and (p_movement_type is null or p.movement_type = p_movement_type)
  order by
    case p.review_status
      when 'under_review' then 0
      when 'unreviewed' then 1
      else 2
    end,
    p.created_at desc
  limit 200;
end;
$$;

create or replace function public.admin_update_campaign_review(
  p_post_id uuid,
  p_review_status text,
  p_reviewed_campaign_type text default null,
  p_review_note text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, private, public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Admin access required';
  end if;

  if p_review_status not in ('unreviewed', 'under_review', 'reviewed', 'rejected') then
    raise exception 'Invalid review status';
  end if;

  if p_review_status = 'reviewed' and p_reviewed_campaign_type is null then
    raise exception 'Reviewed campaign type is required when marking as reviewed';
  end if;

  update private.posts
  set
    review_status = p_review_status,
    reviewed_campaign_type = case
      when p_review_status = 'reviewed' then p_reviewed_campaign_type
      else null
    end,
    reviewed_at = case
      when p_review_status = 'reviewed' then now()
      else null
    end,
    reviewed_by = case
      when p_review_status in ('reviewed', 'rejected', 'under_review') then auth.uid()
      else null
    end,
    review_note = nullif(trim(p_review_note), ''),
    is_trusted_campaign = (p_review_status = 'reviewed'),
    trusted_campaign_type = case
      when p_review_status = 'reviewed' and p_reviewed_campaign_type = 'civic_campaign' then 'civic_action'
      when p_review_status = 'reviewed' then p_reviewed_campaign_type
      else null
    end,
    trusted_at = case when p_review_status = 'reviewed' then now() else null end
  where id = p_post_id;

  if not found then
    raise exception 'Campaign not found';
  end if;
end;
$$;

grant execute on function public.admin_search_profiles_for_trust(text) to authenticated;
grant execute on function public.admin_update_organizer_verification(uuid, boolean, text) to authenticated;
grant execute on function public.admin_get_campaign_review_queue(text, text) to authenticated;
grant execute on function public.admin_update_campaign_review(uuid, text, text, text) to authenticated;

notify pgrst, 'reload schema';
