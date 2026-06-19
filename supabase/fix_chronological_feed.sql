-- =============================================================================
-- ForFuture: FIX CHRONOLOGICAL FEED (all logged-in users see all posts, newest first)
-- Supabase Dashboard → SQL Editor → paste → Run → hard-refresh app (Ctrl+Shift+R)
-- Safe to re-run (idempotent)
--
-- Fixes:
--   • posts_public_safe no longer hides fundraising / under-review posts from the feed
--   • Only draft / rejected / paused posts stay hidden
--   • created_at index for fast ORDER BY created_at DESC
-- =============================================================================

create schema if not exists private;

create index if not exists idx_posts_created_at_desc
  on private.posts (created_at desc);

-- Recreate posts_public_safe — same columns as FIX_MOVEMENTS_FEED_NOW.sql, simpler visibility
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
where coalesce(p.publication_status, 'published') not in ('draft', 'rejected', 'paused');

grant select on public.posts_public_safe to anon, authenticated;

analyze private.posts;

notify pgrst, 'reload schema';
