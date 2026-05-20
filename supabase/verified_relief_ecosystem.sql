-- ForFuture: Verified Donation & Relief ecosystem
-- Run after donation_relief_hub.sql and trust_review_system.sql
-- Idempotent where possible

-- =============================================================================
-- 1. Campaign publication lifecycle (on private.posts)
-- =============================================================================

alter table private.posts add column if not exists publication_status text not null default 'published';

alter table private.posts add column if not exists campaign_summary text;

alter table private.posts add column if not exists external_donation_url text;

alter table private.posts add column if not exists donation_method text;

alter table private.posts add column if not exists donation_contact_note text;

alter table private.posts add column if not exists impact_report jsonb;

alter table private.posts drop constraint if exists posts_publication_status_check;
alter table private.posts add constraint posts_publication_status_check check (
  publication_status in (
    'draft',
    'submitted',
    'under_review',
    'published',
    'needs_changes',
    'rejected',
    'paused',
    'completed'
  )
);

alter table private.posts drop constraint if exists posts_donation_method_check;
alter table private.posts add constraint posts_donation_method_check check (
  donation_method is null
  or donation_method in ('external_link', 'contact_organizer', 'interest_only')
);

-- Fundraising: only verified organizers may create; starts under review until admin publishes
create or replace function public.posts_enforce_verified_fundraising()
returns trigger
language plpgsql
set search_path = pg_catalog, private, public
as $$
declare
  v_verified boolean;
begin
  if new.movement_type <> 'fundraising' then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select coalesce(p.is_verified_organizer, p.is_verified_organization, false)
  into v_verified
  from public.profiles p
  where p.id = auth.uid();

  if not coalesce(v_verified, false) then
    raise exception 'Monetary fundraising campaigns require a verified organization account. Apply for verification in the Verification Center.';
  end if;

  if tg_op = 'INSERT' then
    if new.publication_status = 'published' then
      new.publication_status := 'submitted';
    end if;
    if new.review_status = 'unreviewed' then
      new.review_status := 'under_review';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists posts_enforce_verified_fundraising on private.posts;
create trigger posts_enforce_verified_fundraising
  before insert or update on private.posts
  for each row
  when (new.movement_type = 'fundraising')
  execute function public.posts_enforce_verified_fundraising();

-- =============================================================================
-- 2. Organization verification applications
-- =============================================================================

create table if not exists public.organization_verification_requests (
  id uuid primary key default gen_random_uuid(),
  applicant_user_id uuid not null references public.profiles (id) on delete cascade,
  organization_name text not null,
  organization_type text not null,
  mission text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  operating_area text,
  website_url text,
  social_links text,
  registration_reference text,
  status text not null default 'draft',
  applicant_note text,
  admin_note text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint org_verification_type_check check (
    organization_type in ('ngo', 'charity', 'nonprofit', 'youth_organization', 'community_group', 'other')
  ),
  constraint org_verification_status_check check (
    status in ('draft', 'submitted', 'under_review', 'needs_changes', 'approved', 'rejected')
  )
);

create index if not exists idx_org_verification_applicant
  on public.organization_verification_requests (applicant_user_id);

create index if not exists idx_org_verification_status
  on public.organization_verification_requests (status, created_at desc);

alter table public.organization_verification_requests enable row level security;

drop policy if exists org_verification_select_own on public.organization_verification_requests;
create policy org_verification_select_own on public.organization_verification_requests
  for select to authenticated
  using (applicant_user_id = auth.uid() or public.is_platform_admin());

drop policy if exists org_verification_insert_own on public.organization_verification_requests;
create policy org_verification_insert_own on public.organization_verification_requests
  for insert to authenticated
  with check (applicant_user_id = auth.uid());

drop policy if exists org_verification_update_own_draft on public.organization_verification_requests;
create policy org_verification_update_own_draft on public.organization_verification_requests
  for update to authenticated
  using (
    applicant_user_id = auth.uid()
    and status in ('draft', 'needs_changes')
  )
  with check (applicant_user_id = auth.uid());

-- =============================================================================
-- 3. Campaign updates timeline
-- =============================================================================

create table if not exists public.relief_campaign_updates (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references private.posts (id) on delete cascade,
  author_user_id uuid not null references public.profiles (id) on delete cascade,
  update_type text not null default 'progress',
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint relief_update_type_check check (
    update_type in (
      'progress',
      'supplies_collected',
      'volunteers_confirmed',
      'distribution_started',
      'distribution_completed',
      'impact_report'
    )
  )
);

create index if not exists idx_relief_updates_post
  on public.relief_campaign_updates (post_id, created_at desc);

alter table public.relief_campaign_updates enable row level security;

drop policy if exists relief_updates_select_public on public.relief_campaign_updates;
create policy relief_updates_select_public on public.relief_campaign_updates
  for select to anon, authenticated
  using (
    exists (
      select 1 from private.posts p
      where p.id = post_id
        and p.publication_status in ('published', 'completed')
        and (
          p.movement_type <> 'fundraising'
          or p.review_status = 'reviewed'
        )
    )
  );

drop policy if exists relief_updates_insert_owner on public.relief_campaign_updates;
create policy relief_updates_insert_owner on public.relief_campaign_updates
  for insert to authenticated
  with check (
    author_user_id = auth.uid()
    and exists (
      select 1 from private.posts p
      where p.id = post_id and p.user_id = auth.uid()
    )
  );

-- =============================================================================
-- 4. Admin RPCs — organization verification queue
-- =============================================================================

create or replace function public.admin_get_org_verification_queue(p_status text default null)
returns setof public.organization_verification_requests
language sql
security definer
set search_path = pg_catalog, public
as $$
  select *
  from public.organization_verification_requests r
  where public.is_platform_admin()
    and (p_status is null or p_status = '' or r.status = p_status)
  order by r.created_at desc
  limit 200;
$$;

create or replace function public.admin_update_org_verification(
  p_request_id uuid,
  p_status text,
  p_admin_note text default null,
  p_grant_verification boolean default false,
  p_verification_type text default 'organization'
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_row public.organization_verification_requests%rowtype;
begin
  if not public.is_platform_admin() then
    raise exception 'Not authorized';
  end if;

  select * into v_row from public.organization_verification_requests where id = p_request_id;
  if not found then
    raise exception 'Request not found';
  end if;

  update public.organization_verification_requests
  set
    status = p_status,
    admin_note = coalesce(p_admin_note, admin_note),
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  where id = p_request_id;

  if p_grant_verification and p_status = 'approved' then
    update public.profiles
    set
      is_verified_organizer = true,
      organizer_verification_type = coalesce(p_verification_type, 'organization'),
      organizer_verified_at = now()
    where id = v_row.applicant_user_id;
  end if;
end;
$$;

grant execute on function public.admin_get_org_verification_queue(text) to authenticated;
grant execute on function public.admin_update_org_verification(uuid, text, text, boolean, text) to authenticated;

-- =============================================================================
-- 5. Refresh posts_public_safe — hide non-public relief/fundraising
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
  on pr.id = p.user_id and p.posting_identity <> 'youth_voice'
where p.publication_status in ('published', 'completed')
  and p.publication_status not in ('draft', 'submitted', 'rejected', 'paused', 'needs_changes')
  and (
    p.movement_type is distinct from 'fundraising'
    or p.review_status = 'reviewed'
  );

grant select on public.posts_public_safe to anon, authenticated;

notify pgrst, 'reload schema';
