-- Fix Supabase Database Linter security warnings (0025, 0028, 0029)
-- Safe to re-run in Supabase SQL Editor.
--
-- 1. Public buckets: remove broad SELECT policies that allow listing all objects.
-- 2. SECURITY DEFINER RPCs: switch to SECURITY INVOKER + RLS, or revoke API execute.
-- 3. Trigger helpers: revoke execute from anon/authenticated (not callable via PostgREST).

-- =============================================================================
-- 1. Storage — public buckets do not need SELECT policies for direct URLs
-- =============================================================================

drop policy if exists "Public read movement images" on storage.objects;
drop policy if exists "Public read movement documents" on storage.objects;

-- =============================================================================
-- 2. RLS — admin + invoker helpers need broader profile/post access for admins
-- =============================================================================

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = (select auth.uid())),
    false
  );
$$;

revoke all on function public.is_platform_admin() from public;
revoke all on function public.is_platform_admin() from anon;
grant execute on function public.is_platform_admin() to authenticated;

drop policy if exists "Profiles select own or verified badges" on public.profiles;
create policy "Profiles select own or verified badges"
  on public.profiles for select to anon, authenticated
  using (
    (select auth.uid()) = id
    or coalesce(is_verified_organization, false) = true
    or coalesce(is_verified_organizer, false) = true
    or public.is_platform_admin()
  );

drop policy if exists "Admins update profiles for trust verification" on public.profiles;
create policy "Admins update profiles for trust verification"
  on public.profiles for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

do $$
begin
  if exists (
    select 1 from pg_tables where schemaname = 'private' and tablename = 'posts'
  ) then
    execute 'drop policy if exists "Admins update posts for campaign review" on private.posts';
    execute $p$
      create policy "Admins update posts for campaign review"
        on private.posts for update to authenticated
        using (public.is_platform_admin())
        with check (public.is_platform_admin())
    $p$;
  end if;
end;
$$;

-- =============================================================================
-- 3. Internal helper (private schema — not exposed via PostgREST)
-- =============================================================================

create or replace function private.count_processed_content_reports()
returns integer
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select count(*)::integer
  from public.content_reports
  where status in ('action_taken', 'no_violation_found', 'dismissed', 'under_review');
$$;

revoke all on function private.count_processed_content_reports() from public;
grant execute on function private.count_processed_content_reports() to anon, authenticated;

-- =============================================================================
-- 4. Public helpers — SECURITY INVOKER (safe via RLS / private helper)
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

create or replace function public.get_youth_impact_pulse_dashboard()
returns jsonb
language plpgsql
security invoker
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
          ) then private.count_processed_content_reports()
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

revoke all on function public.get_youth_impact_pulse_dashboard() from public;
revoke all on function public.get_youth_impact_pulse_dashboard() from anon;
grant execute on function public.get_youth_impact_pulse_dashboard() to anon, authenticated;

-- =============================================================================
-- 5. Admin RPCs — SECURITY INVOKER (admin gate + RLS policies above)
-- =============================================================================

alter function public.admin_get_platform_stats() security invoker;
alter function public.admin_list_profiles(text, int, int) security invoker;
alter function public.admin_get_recent_activity(int) security invoker;
alter function public.admin_get_moderation_queue() security invoker;
alter function public.admin_update_content_report(uuid, text, text) security invoker;
alter function public.admin_get_comment_moderation_queue() security invoker;
alter function public.admin_update_comment_report(uuid, text, text) security invoker;
alter function public.admin_search_profiles_for_trust(text) security invoker;
alter function public.admin_update_organizer_verification(uuid, boolean, text) security invoker;
alter function public.admin_get_campaign_review_queue(text, text) security invoker;
alter function public.admin_update_campaign_review(uuid, text, text, text) security invoker;

-- Authenticated admins only (explicit revoke from anon)
revoke all on function public.admin_get_platform_stats() from public;
revoke all on function public.admin_get_platform_stats() from anon;
grant execute on function public.admin_get_platform_stats() to authenticated;

revoke all on function public.admin_list_profiles(text, int, int) from public;
revoke all on function public.admin_list_profiles(text, int, int) from anon;
grant execute on function public.admin_list_profiles(text, int, int) to authenticated;

revoke all on function public.admin_get_recent_activity(int) from public;
revoke all on function public.admin_get_recent_activity(int) from anon;
grant execute on function public.admin_get_recent_activity(int) to authenticated;

revoke all on function public.admin_get_moderation_queue() from public;
revoke all on function public.admin_get_moderation_queue() from anon;
grant execute on function public.admin_get_moderation_queue() to authenticated;

revoke all on function public.admin_update_content_report(uuid, text, text) from public;
revoke all on function public.admin_update_content_report(uuid, text, text) from anon;
grant execute on function public.admin_update_content_report(uuid, text, text) to authenticated;

revoke all on function public.admin_get_comment_moderation_queue() from public;
revoke all on function public.admin_get_comment_moderation_queue() from anon;
grant execute on function public.admin_get_comment_moderation_queue() to authenticated;

revoke all on function public.admin_update_comment_report(uuid, text, text) from public;
revoke all on function public.admin_update_comment_report(uuid, text, text) from anon;
grant execute on function public.admin_update_comment_report(uuid, text, text) to authenticated;

revoke all on function public.admin_search_profiles_for_trust(text) from public;
revoke all on function public.admin_search_profiles_for_trust(text) from anon;
grant execute on function public.admin_search_profiles_for_trust(text) to authenticated;

revoke all on function public.admin_update_organizer_verification(uuid, boolean, text) from public;
revoke all on function public.admin_update_organizer_verification(uuid, boolean, text) from anon;
grant execute on function public.admin_update_organizer_verification(uuid, boolean, text) to authenticated;

revoke all on function public.admin_get_campaign_review_queue(text, text) from public;
revoke all on function public.admin_get_campaign_review_queue(text, text) from anon;
grant execute on function public.admin_get_campaign_review_queue(text, text) to authenticated;

revoke all on function public.admin_update_campaign_review(uuid, text, text, text) from public;
revoke all on function public.admin_update_campaign_review(uuid, text, text, text) from anon;
grant execute on function public.admin_update_campaign_review(uuid, text, text, text) to authenticated;

-- =============================================================================
-- 6. Trigger helper — not callable via PostgREST
-- =============================================================================

revoke all on function public.poll_vote_after_insert() from public;
revoke all on function public.poll_vote_after_insert() from anon, authenticated;

-- =============================================================================
-- 7. Security definer view — use invoker + underlying RLS
-- =============================================================================

create or replace view public.movement_follower_counts
with (security_invoker = true)
as
select
  movement_id,
  count(*)::int as follower_count
from public.movement_follows
group by movement_id;

grant select on public.movement_follower_counts to anon, authenticated;

-- =============================================================================
-- 8. RLS enabled with no policies — document service-role-only table
-- =============================================================================

drop policy if exists "Block anon access to actionpath ai usage" on public.actionpath_ai_usage;
create policy "Block anon access to actionpath ai usage"
  on public.actionpath_ai_usage for all
  to anon
  using (false)
  with check (false);

drop policy if exists "Block authenticated direct access to actionpath ai usage" on public.actionpath_ai_usage;
create policy "Block authenticated direct access to actionpath ai usage"
  on public.actionpath_ai_usage for all
  to authenticated
  using (false)
  with check (false);

notify pgrst, 'reload schema';
