-- ForFuture: Donation & Relief Hub
-- Run after fix_database.sql and trust_review_system.sql
-- Safe to re-run (idempotent)

-- =============================================================================
-- 1. New columns on private.posts
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

alter table private.posts drop constraint if exists posts_donation_subtype_check;
alter table private.posts add constraint posts_donation_subtype_check check (
  donation_subtype is null
  or donation_subtype in ('blood_donation', 'item_donation')
);

alter table private.posts drop constraint if exists posts_relief_status_check;
alter table private.posts add constraint posts_relief_status_check check (
  relief_status in (
    'open',
    'donors_responding',
    'needed',
    'partially_fulfilled',
    'fulfilled',
    'closed'
  )
);

alter table private.posts drop constraint if exists posts_urgency_level_check;
alter table private.posts add constraint posts_urgency_level_check check (
  urgency_level is null
  or urgency_level in (
    'urgent_today',
    'within_24_hours',
    'scheduled_drive',
    'general_awareness'
  )
);

alter table private.posts drop constraint if exists posts_item_category_check;
alter table private.posts add constraint posts_item_category_check check (
  item_category is null
  or item_category in (
    'school_supplies',
    'food_rations',
    'clothing',
    'hygiene',
    'books',
    'disaster_relief',
    'medical_supplies',
    'other_essentials'
  )
);

-- =============================================================================
-- 2. movement_type includes donation_relief
-- =============================================================================

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

-- Fundraising must use public profile (existing rule + donation_relief fundraising path uses movement_type fundraising)
create or replace function public.posts_enforce_fundraising_profile_identity()
returns trigger
language plpgsql
set search_path = pg_catalog, private, public
as $$
begin
  if new.movement_type = 'fundraising' and new.posting_identity = 'youth_voice' then
    raise exception 'Fundraising campaigns must be posted with your public profile for trust and transparency';
  end if;
  if new.movement_type = 'donation_relief' and new.donation_subtype is null then
    raise exception 'Donation & Relief posts require a donation subtype';
  end if;
  if new.movement_type = 'donation_relief' and new.donation_subtype not in ('blood_donation', 'item_donation') then
    raise exception 'Invalid donation subtype for Donation & Relief';
  end if;
  return new;
end;
$$;

drop trigger if exists posts_enforce_fundraising_profile_identity on private.posts;
create trigger posts_enforce_fundraising_profile_identity
  before insert or update on private.posts
  for each row execute function public.posts_enforce_fundraising_profile_identity();

-- =============================================================================
-- 3. post_actions — blood / item response types
-- =============================================================================

alter table public.post_actions drop constraint if exists post_actions_action_type_check;
alter table public.post_actions add constraint post_actions_action_type_check check (
  action_type in (
    'support_idea',
    'stand_with_voice',
    'volunteer_interest',
    'fundraising_support',
    'join_cause',
    'offer_blood_donation',
    'pledge_item_donation'
  )
);

-- =============================================================================
-- 4. Refresh posts_public_safe
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
  on pr.id = p.user_id and p.posting_identity <> 'youth_voice';

grant select on public.posts_public_safe to anon, authenticated;

notify pgrst, 'reload schema';

-- Forward donation_subtype through public.posts insert facade
create or replace function public.posts_facade_insert()
returns trigger
language plpgsql
set search_path = pg_catalog, private, public
as $$
declare inserted private.posts%rowtype;
begin
  insert into private.posts (
    user_id, title, description, category, author_name, posting_identity, youth_voice_id,
    movement_type,
    donation_subtype, relief_status, blood_group, hospital_or_organizer, urgency_level,
    donors_needed, needed_by_date, item_category, items_needed, quantity_needed,
    beneficiary_group, collection_location, relief_deadline, organizer_transparency_note,
    proposed_solution, expected_impact, issue_summary, desired_change,
    event_date, event_time, location, volunteer_slots, contact_note,
    fundraising_goal_amount, fundraising_purpose, beneficiary_description, current_raised_amount,
    action_date, action_time, action_location, action_purpose, safety_note,
    petition_issue, petition_requested_change, petition_target_authority,
    petition_support_goal, petition_closing_date, petition_impact_note,
    location_name, latitude, longitude
  ) values (
    new.user_id, new.title, new.description, new.category, new.author_name,
    new.posting_identity, new.youth_voice_id, new.movement_type,
    new.donation_subtype, coalesce(new.relief_status, 'open'), new.blood_group, new.hospital_or_organizer,
    new.urgency_level, new.donors_needed, new.needed_by_date, new.item_category, new.items_needed,
    new.quantity_needed, new.beneficiary_group, new.collection_location, new.relief_deadline,
    new.organizer_transparency_note,
    new.proposed_solution, new.expected_impact, new.issue_summary, new.desired_change,
    new.event_date, new.event_time, new.location, new.volunteer_slots, new.contact_note,
    new.fundraising_goal_amount, new.fundraising_purpose, new.beneficiary_description,
    coalesce(new.current_raised_amount, 0),
    new.action_date, new.action_time, new.action_location, new.action_purpose, new.safety_note,
    new.petition_issue, new.petition_requested_change, new.petition_target_authority,
    new.petition_support_goal, new.petition_closing_date, new.petition_impact_note,
    new.location_name, new.latitude, new.longitude
  )
  returning * into inserted;
  return inserted;
end;
$$;

notify pgrst, 'reload schema';
