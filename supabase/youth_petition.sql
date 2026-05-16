-- ForFuture: Youth Petition movement type + petition_signatures
-- Run in Supabase SQL Editor after fix_publish_movement.sql / content_reports.sql.
-- Safe to re-run.

-- =============================================================================
-- 1. Petition columns on private.posts
-- =============================================================================

alter table private.posts add column if not exists petition_issue text;
alter table private.posts add column if not exists petition_requested_change text;
alter table private.posts add column if not exists petition_target_authority text;
alter table private.posts add column if not exists petition_support_goal integer;
alter table private.posts add column if not exists petition_closing_date date;
alter table private.posts add column if not exists petition_impact_note text;

alter table private.posts drop constraint if exists posts_petition_support_goal_check;
alter table private.posts add constraint posts_petition_support_goal_check check (
  petition_support_goal is null or petition_support_goal > 0
);

alter table private.posts drop constraint if exists posts_movement_type_check;
alter table private.posts add constraint posts_movement_type_check check (
  movement_type in (
    'idea_for_change',
    'raise_voice',
    'volunteer_drive',
    'fundraising',
    'peaceful_civic_action',
    'quick_youth_poll',
    'youth_petition'
  )
);

-- =============================================================================
-- 2. Recreate posts_public_safe (includes petition columns)
-- =============================================================================

do $$
begin
  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
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
  p.location_name,
  p.latitude,
  p.longitude,
  p.petition_issue,
  p.petition_requested_change,
  p.petition_target_authority,
  p.petition_support_goal,
  p.petition_closing_date,
  p.petition_impact_note,
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

-- =============================================================================
-- 3. petition_signatures
-- =============================================================================

create table if not exists public.petition_signatures (
  id uuid primary key default gen_random_uuid(),
  petition_id uuid not null references private.posts (id) on delete cascade,
  supporter_user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (petition_id, supporter_user_id)
);

create index if not exists idx_petition_signatures_petition_id
  on public.petition_signatures (petition_id);

create index if not exists idx_petition_signatures_supporter_user_id
  on public.petition_signatures (supporter_user_id);

create or replace function public.petition_signatures_set_supporter()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required to sign a petition';
  end if;
  new.supporter_user_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists petition_signatures_set_supporter on public.petition_signatures;
create trigger petition_signatures_set_supporter
  before insert on public.petition_signatures
  for each row execute function public.petition_signatures_set_supporter();

-- =============================================================================
-- 4. RLS
-- =============================================================================

alter table public.petition_signatures enable row level security;

drop policy if exists "Petition signatures readable by everyone" on public.petition_signatures;
create policy "Petition signatures readable by everyone"
  on public.petition_signatures for select to anon, authenticated
  using (true);

drop policy if exists "Users sign petitions as themselves" on public.petition_signatures;
create policy "Users sign petitions as themselves"
  on public.petition_signatures for insert to authenticated
  with check (auth.uid() = supporter_user_id);

grant select on public.petition_signatures to anon, authenticated;
grant insert on public.petition_signatures to authenticated;

analyze public.petition_signatures;

notify pgrst, 'reload schema';
