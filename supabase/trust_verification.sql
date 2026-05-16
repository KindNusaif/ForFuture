-- Trust & Verification — run after 00_fix_all.sql (safe to re-run)
-- Verified Organization (profiles) + Trusted Campaign (private.posts)

-- =============================================================================
-- 1. profiles — Verified Organization
-- =============================================================================

alter table public.profiles
  add column if not exists is_verified_organization boolean not null default false;

alter table public.profiles
  add column if not exists organization_verification_type text;

alter table public.profiles
  add column if not exists verified_at timestamptz;

alter table public.profiles drop constraint if exists profiles_organization_verification_type_check;
alter table public.profiles add constraint profiles_organization_verification_type_check check (
  organization_verification_type is null
  or organization_verification_type in (
    'ngo', 'student_society', 'community_partner', 'official_organization'
  )
);

-- =============================================================================
-- 2. private.posts — Trusted Campaign
-- =============================================================================

alter table private.posts
  add column if not exists is_trusted_campaign boolean not null default false;

alter table private.posts
  add column if not exists trusted_campaign_type text;

alter table private.posts
  add column if not exists trusted_at timestamptz;

alter table private.posts drop constraint if exists posts_trusted_campaign_type_check;
alter table private.posts add constraint posts_trusted_campaign_type_check check (
  trusted_campaign_type is null
  or trusted_campaign_type in (
    'fundraising', 'volunteer_drive', 'civic_action', 'general_campaign'
  )
);

-- =============================================================================
-- 3. Block self-verification (authenticated API users)
-- =============================================================================

create or replace function public.profiles_block_verification_self_update()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is not null then
    if new.is_verified_organization is distinct from old.is_verified_organization
       or new.organization_verification_type is distinct from old.organization_verification_type
       or new.verified_at is distinct from old.verified_at then
      raise exception 'Organization verification can only be changed by platform administrators';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.posts_block_trusted_self_update()
returns trigger
language plpgsql
set search_path = pg_catalog, private, public
as $$
begin
  if auth.uid() is not null then
    if new.is_trusted_campaign is distinct from old.is_trusted_campaign
       or new.trusted_campaign_type is distinct from old.trusted_campaign_type
       or new.trusted_at is distinct from old.trusted_at then
      raise exception 'Trusted campaign status can only be changed by platform administrators';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_block_verification_self_update on public.profiles;
create trigger profiles_block_verification_self_update
  before update on public.profiles
  for each row execute function public.profiles_block_verification_self_update();

drop trigger if exists posts_block_trusted_self_update on private.posts;
create trigger posts_block_trusted_self_update
  before update on private.posts
  for each row execute function public.posts_block_trusted_self_update();

-- =============================================================================
-- 4. RLS — allow public read of verified-org flags only (for feed badges)
-- =============================================================================

drop policy if exists "Public can read verified organization flags" on public.profiles;
create policy "Public can read verified organization flags"
  on public.profiles for select
  to anon, authenticated
  using (is_verified_organization = true);

-- =============================================================================
-- 5. Refresh posts_public_safe view (trusted + author verification, no YV leak)
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
  p.location_name, p.latitude, p.longitude,
  p.is_trusted_campaign,
  p.trusted_campaign_type,
  p.trusted_at,
  case
    when p.posting_identity = 'youth_voice' then false
    else coalesce(pr.is_verified_organization, false)
  end as author_is_verified_organization,
  case
    when p.posting_identity = 'youth_voice' then null::text
    else pr.organization_verification_type
  end as author_organization_verification_type
from private.posts p
left join public.profiles pr
  on pr.id = p.user_id and p.posting_identity <> 'youth_voice';

grant select on public.posts_public_safe to anon, authenticated;

notify pgrst, 'reload schema';
