-- =============================================================================
-- ForFuture: FIX MOVEMENTS FEED (run this when the app says "database needs an update")
-- Supabase Dashboard → SQL Editor → paste → Run → hard-refresh app (Ctrl+Shift+R)
-- Safe to re-run (idempotent)
--
-- Run AFTER fix_database.sql if you already ran it (this repairs posts_public_safe).
-- =============================================================================

create schema if not exists private;

-- =============================================================================
-- 1. Trust & organizer columns (trust_review_system.sql)
-- =============================================================================

alter table public.profiles
  add column if not exists is_verified_organizer boolean not null default false;
alter table public.profiles
  add column if not exists organizer_verification_type text;
alter table public.profiles
  add column if not exists organizer_verified_at timestamptz;

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

-- =============================================================================
-- 2. Relief hub columns (donation_relief_hub.sql)
-- =============================================================================

alter table private.posts add column if not exists donation_subtype text;
alter table private.posts add column if not exists relief_status text not null default 'open';
alter table private.posts add column if not exists blood_group text;
alter table private.posts add column if not exists hospital_or_organizer text;
alter table private.posts add column if not exists urgency_level text;
alter table private.posts add column if not exists donors_needed integer;
alter table private.posts add column if not exists needed_by_date date;
alter table private.posts add column if not exists item_category text;
alter table private.posts add column if not exists items_needed text;
alter table private.posts add column if not exists quantity_needed integer;
alter table private.posts add column if not exists beneficiary_group text;
alter table private.posts add column if not exists collection_location text;
alter table private.posts add column if not exists relief_deadline date;
alter table private.posts add column if not exists organizer_transparency_note text;

-- =============================================================================
-- 3. Publication & donation campaign columns (verified_relief_ecosystem.sql)
-- =============================================================================

alter table private.posts add column if not exists publication_status text not null default 'published';
alter table private.posts add column if not exists campaign_summary text;
alter table private.posts add column if not exists external_donation_url text;
alter table private.posts add column if not exists donation_method text;
alter table private.posts add column if not exists donation_contact_note text;
alter table private.posts add column if not exists impact_report jsonb;

-- Petition columns (may already exist from fix_database.sql)
alter table private.posts add column if not exists petition_issue text;
alter table private.posts add column if not exists petition_requested_change text;
alter table private.posts add column if not exists petition_target_authority text;
alter table private.posts add column if not exists petition_support_goal integer;
alter table private.posts add column if not exists petition_closing_date date;
alter table private.posts add column if not exists petition_impact_note text;

-- Legacy rows: treat null publication as published so they stay visible
update private.posts set publication_status = 'published'
  where publication_status is null;

-- Fundraising visible when reviewed OR legacy trusted flag
update private.posts
set review_status = 'reviewed'
where movement_type = 'fundraising'
  and review_status = 'unreviewed'
  and coalesce(is_trusted_campaign, false) = true;

alter table private.posts drop constraint if exists posts_movement_type_check;
alter table private.posts add constraint posts_movement_type_check check (
  movement_type in (
    'idea_for_change',
    'raise_voice',
    'volunteer_drive',
    'fundraising',
    'peaceful_civic_action',
    'quick_youth_poll',
    'youth_petition',
    'donation_relief'
  )
);

-- =============================================================================
-- 4. Full posts_public_safe view (matches src/lib/postColumns.ts)
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
  p.donation_subtype,
  p.relief_status,
  p.blood_group,
  p.hospital_or_organizer,
  p.urgency_level,
  p.donors_needed,
  p.needed_by_date,
  p.item_category,
  p.items_needed,
  p.quantity_needed,
  p.beneficiary_group,
  p.collection_location,
  p.relief_deadline,
  p.organizer_transparency_note,
  p.campaign_summary,
  p.external_donation_url,
  p.donation_method,
  p.donation_contact_note,
  p.impact_report,
  p.publication_status,
  p.proposed_solution,
  p.expected_impact,
  p.issue_summary,
  p.desired_change,
  p.event_date,
  p.event_time,
  p.location,
  p.volunteer_slots,
  p.contact_note,
  p.fundraising_goal_amount,
  p.fundraising_purpose,
  p.beneficiary_description,
  p.current_raised_amount,
  p.action_date,
  p.action_time,
  p.action_location,
  p.action_purpose,
  p.safety_note,
  p.petition_issue,
  p.petition_requested_change,
  p.petition_target_authority,
  p.petition_support_goal,
  p.petition_closing_date,
  p.petition_impact_note,
  p.location_name,
  p.latitude,
  p.longitude,
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
  end as author_is_verified_organizer,
  case
    when p.posting_identity = 'youth_voice' then false
    else coalesce(pr.is_verified_organizer, pr.is_verified_organization, false)
  end as author_is_verified_organization,
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
  end as author_organizer_verification_type,
  case
    when p.posting_identity = 'youth_voice' then null::text
    else coalesce(
      pr.organizer_verification_type,
      case pr.organization_verification_type
        when 'official_organization' then 'organization'
        else pr.organization_verification_type
      end
    )
  end as author_organization_verification_type
from private.posts p
left join public.profiles pr
  on pr.id = p.user_id and p.posting_identity <> 'youth_voice'
where p.publication_status in ('published', 'completed')
  and (
    p.movement_type is distinct from 'fundraising'
    or p.review_status = 'reviewed'
  );

grant select on public.posts_public_safe to anon, authenticated;

notify pgrst, 'reload schema';
