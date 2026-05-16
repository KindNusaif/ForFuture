-- ForFuture: Youth Impact Pulse — public aggregate dashboard metrics
-- Run after fix_database.sql, trust_review_system.sql, donation_relief_hub.sql
-- Safe to re-run (idempotent)

-- =============================================================================
-- RPC: single public-safe JSON payload (aggregates only — no PII)
-- =============================================================================

create or replace function public.get_youth_impact_pulse_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, private, public
as $$
declare
  week_start timestamptz := now() - interval '7 days';
  result jsonb;
begin
  with posts as (
    select
      p.id,
      p.title,
      p.category,
      p.movement_type,
      p.posting_identity,
      p.youth_voice_id,
      p.created_at,
      p.review_status,
      p.reviewed_campaign_type,
      coalesce(nullif(trim(p.district), ''), null) as district,
      case
        when p.posting_identity = 'youth_voice' and p.youth_voice_id is not null then
          'Youth Voice ' || p.youth_voice_id
        else p.author_name
      end as public_author_name
    from private.posts p
  ),
  action_counts as (
    select
      pa.post_id,
      count(*)::int as action_count
    from public.post_actions pa
    group by pa.post_id
  ),
  petition_counts as (
    select
      ps.petition_id as post_id,
      count(*)::int as signature_count
    from public.petition_signatures ps
    group by ps.petition_id
  ),
  poll_counts as (
    select
      pv.post_id,
      count(*)::int as vote_count
    from public.poll_votes pv
    group by pv.post_id
  ),
  engagement as (
    select
      po.id,
      po.title,
      po.category,
      po.movement_type,
      po.posting_identity,
      po.youth_voice_id,
      po.public_author_name,
      po.created_at,
      po.review_status,
      po.reviewed_campaign_type,
      po.district,
      case
        when po.movement_type = 'youth_petition' then coalesce(pc.signature_count, 0)
        when po.movement_type = 'quick_youth_poll' then coalesce(pl.vote_count, 0)
        else coalesce(ac.action_count, 0)
      end as engagement_count
    from posts po
    left join action_counts ac on ac.post_id = po.id
    left join petition_counts pc on pc.post_id = po.id
    left join poll_counts pl on pl.post_id = po.id
  ),
  glance as (
    select jsonb_build_object(
      'youth_voices_shared',
        (select count(*)::int from posts where movement_type = 'raise_voice'),
      'movements_launched',
        (select count(*)::int from posts where movement_type <> 'quick_youth_poll'),
      'petitions_started',
        (select count(*)::int from posts where movement_type = 'youth_petition'),
      'volunteer_drives',
        (select count(*)::int from posts where movement_type = 'volunteer_drive'),
      'relief_causes',
        (select count(*)::int from posts where movement_type in ('fundraising', 'donation_relief')),
      'poll_votes',
        (select count(*)::int from public.poll_votes)
    ) as data
  ),
  journey as (
    select jsonb_build_object(
      'voices_raised',
        (select count(*)::int from posts where movement_type = 'raise_voice'),
      'petitions_created',
        (select count(*)::int from posts where movement_type = 'youth_petition'),
      'volunteer_drives',
        (select count(*)::int from posts where movement_type = 'volunteer_drive'),
      'relief_causes',
        (select count(*)::int from posts where movement_type in ('fundraising', 'donation_relief')),
      'trusted_reviewed',
        (select count(*)::int from posts where review_status = 'reviewed')
    ) as data
  ),
  weekly_supported as (
    select e.*
    from engagement e
    where e.created_at >= week_start
      and e.movement_type <> 'quick_youth_poll'
    order by e.engagement_count desc, e.created_at desc
    limit 1
  ),
  weekly_petition_growth as (
    select
      po.id,
      po.title,
      po.category,
      po.movement_type,
      count(ps.*) filter (where ps.created_at >= week_start)::int as week_signatures,
      count(ps.*)::int as total_signatures
    from posts po
    inner join public.petition_signatures ps on ps.petition_id = po.id
    where po.movement_type = 'youth_petition'
    group by po.id, po.title, po.category, po.movement_type
    order by week_signatures desc, total_signatures desc
    limit 1
  ),
  weekly_top_type as (
    select movement_type, count(*)::int as cnt
    from posts
    where created_at >= week_start
      and movement_type <> 'quick_youth_poll'
    group by movement_type
    order by cnt desc
    limit 1
  ),
  weekly_top_category as (
    select category, count(*)::int as cnt
    from posts
    where created_at >= week_start
    group by category
    order by cnt desc
    limit 1
  ),
  category_rows as (
    select
      category,
      count(*)::int as movement_count
    from posts
    where movement_type <> 'quick_youth_poll'
    group by category
    order by movement_count desc
    limit 8
  ),
  category_total as (
    select coalesce(sum(movement_count), 0)::int as total from category_rows
  ),
  district_rows as (
    select
      coalesce(district, 'Unspecified region') as district_label,
      count(*)::int as movement_count
    from posts
    where district is not null
      and movement_type in (
        'volunteer_drive', 'peaceful_civic_action', 'fundraising',
        'donation_relief', 'raise_voice'
      )
    group by district_label
    having count(*) >= 1
    order by movement_count desc
    limit 8
  ),
  participation as (
    select jsonb_build_object(
      'poll_votes', (select count(*)::int from public.poll_votes),
      'petition_signatures', (select count(*)::int from public.petition_signatures),
      'volunteer_responses',
        (select count(*)::int from public.post_actions where action_type = 'volunteer_interest'),
      'relief_blood', (select count(*)::int from public.post_actions where action_type = 'offer_blood_donation'),
      'relief_items', (select count(*)::int from public.post_actions where action_type = 'pledge_item_donation'),
      'fundraising_support',
        (select count(*)::int from public.post_actions where action_type = 'fundraising_support'),
      'movement_supports',
        (select count(*)::int from public.post_actions
         where action_type in ('support_idea', 'stand_with_voice', 'join_cause'))
    ) as data
  ),
  trust as (
    select jsonb_build_object(
      'verified_organizers',
        (select count(*)::int from public.profiles where is_verified_organizer = true
           or is_verified_organization = true),
      'reviewed_campaigns',
        (select count(*)::int from posts where review_status = 'reviewed'),
      'trusted_fundraising',
        (select count(*)::int from posts
         where review_status = 'reviewed'
           and (reviewed_campaign_type = 'fundraising' or movement_type = 'fundraising')),
      'reports_processed',
        case
          when exists (
            select 1 from pg_tables
            where schemaname = 'public' and tablename = 'content_reports'
          ) then (
            select count(*)::int from public.content_reports
            where status in ('action_taken', 'no_violation_found', 'dismissed', 'under_review')
          )
          else 0
        end,
      'youth_voice_posts',
        (select count(*)::int from posts where posting_identity = 'youth_voice')
    ) as data
  ),
  spotlight_row as (
    select *
    from engagement
    where engagement_count > 0
      and movement_type <> 'quick_youth_poll'
    order by engagement_count desc, created_at desc
    limit 1
  )
  select jsonb_build_object(
    'generated_at', now(),
    'glance', (select data from glance),
    'journey', (select data from journey),
    'weekly', jsonb_build_object(
      'most_supported',
        (select to_jsonb(ws) from weekly_supported ws),
      'fastest_petition',
        (select to_jsonb(wp) from weekly_petition_growth wp),
      'top_movement_type',
        (select movement_type from weekly_top_type),
      'top_category',
        (select category from weekly_top_category)
    ),
    'categories',
      coalesce(
        (select jsonb_agg(
          jsonb_build_object(
            'category', cr.category,
            'count', cr.movement_count,
            'share',
              case when ct.total > 0
                then round(cr.movement_count::numeric / ct.total, 4)
                else 0 end
          )
          order by cr.movement_count desc
        )
        from category_rows cr cross join category_total ct),
        '[]'::jsonb
      ),
    'districts',
      coalesce(
        (select jsonb_agg(
          jsonb_build_object(
            'district', dr.district_label,
            'count', dr.movement_count
          )
          order by dr.movement_count desc
        )
        from district_rows dr),
        '[]'::jsonb
      ),
    'participation', (select data from participation),
    'trust', (select data from trust),
    'spotlight',
      (select to_jsonb(s) from spotlight_row s)
  ) into result;

  return result;
end;
$$;

grant execute on function public.get_youth_impact_pulse_dashboard() to anon, authenticated;

notify pgrst, 'reload schema';
