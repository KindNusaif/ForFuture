-- ForFuture: patch an existing Supabase project (safe to re-run)
-- Run in SQL Editor when:
--   • poll_options / poll_votes are missing (polls fail)
--   • posts_public_safe lacks trust / verification columns
--   • You previously ran recover_posts_api.sql only
--
-- If publishing a movement fails, run FIRST: supabase/fix_publish_movement.sql
-- For civic action buttons on posts, run: supabase/post_actions.sql
-- For a fresh project or full reset, prefer: supabase/00_fix_all.sql

create schema if not exists private;

-- =============================================================================
-- 1. Trust & verification columns
-- =============================================================================

alter table public.profiles
  add column if not exists is_verified_organization boolean not null default false;
alter table public.profiles
  add column if not exists organization_verification_type text;
alter table public.profiles
  add column if not exists verified_at timestamptz;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists avatar_url text;

alter table public.profiles drop constraint if exists profiles_organization_verification_type_check;
alter table public.profiles add constraint profiles_organization_verification_type_check check (
  organization_verification_type is null
  or organization_verification_type in (
    'ngo', 'student_society', 'community_partner', 'official_organization'
  )
);

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
-- 2. Movement type constraint (includes quick_youth_poll)
-- =============================================================================

alter table private.posts drop constraint if exists posts_movement_type_check;
alter table private.posts add constraint posts_movement_type_check check (
  movement_type in (
    'idea_for_change', 'raise_voice', 'volunteer_drive', 'fundraising',
    'peaceful_civic_action', 'quick_youth_poll'
  )
);

-- =============================================================================
-- 3. Recreate posts_public_safe (trust + verification join)
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

-- =============================================================================
-- 4. Poll tables
-- =============================================================================

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references private.posts (id) on delete cascade,
  option_text text not null check (char_length(trim(option_text)) > 0),
  sort_order smallint not null default 0,
  vote_count integer not null default 0 check (vote_count >= 0),
  created_at timestamptz not null default now()
);
create index if not exists poll_options_post_id_idx on public.poll_options (post_id);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references private.posts (id) on delete cascade,
  option_id uuid not null references public.poll_options (id) on delete cascade,
  voter_user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, voter_user_id)
);
create index if not exists poll_votes_post_id_idx on public.poll_votes (post_id);
create index if not exists poll_votes_voter_idx on public.poll_votes (voter_user_id);

create or replace function public.poll_vote_after_insert()
returns trigger language plpgsql security definer set search_path = pg_catalog, public
as $$
begin
  if not exists (
    select 1 from public.poll_options where id = new.option_id and post_id = new.post_id
  ) then
    raise exception 'Invalid option for this poll';
  end if;
  update public.poll_options set vote_count = vote_count + 1 where id = new.option_id;
  return new;
end;
$$;

drop trigger if exists poll_vote_after_insert on public.poll_votes;
create trigger poll_vote_after_insert
  after insert on public.poll_votes
  for each row execute function public.poll_vote_after_insert();

alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

drop policy if exists "Poll options are publicly readable" on public.poll_options;
create policy "Poll options are publicly readable"
  on public.poll_options for select to anon, authenticated using (true);

drop policy if exists "Poll creators can add options" on public.poll_options;
create policy "Poll creators can add options"
  on public.poll_options for insert to authenticated
  with check (
    exists (select 1 from private.posts p where p.id = post_id and p.user_id = auth.uid())
  );

drop policy if exists "Poll owners can delete options" on public.poll_options;
create policy "Poll owners can delete options"
  on public.poll_options for delete to authenticated
  using (
    exists (select 1 from private.posts p where p.id = post_id and p.user_id = auth.uid())
  );

drop policy if exists "Users can read own poll votes" on public.poll_votes;
create policy "Users can read own poll votes"
  on public.poll_votes for select to authenticated using (voter_user_id = auth.uid());

drop policy if exists "Authenticated users can vote once per poll" on public.poll_votes;
create policy "Authenticated users can vote once per poll"
  on public.poll_votes for insert to authenticated
  with check (
    voter_user_id = auth.uid()
    and exists (
      select 1 from public.poll_options o where o.id = option_id and o.post_id = post_id
    )
    and exists (
      select 1 from private.posts p
      where p.id = post_id and p.movement_type = 'quick_youth_poll'
    )
  );

grant select on public.poll_options to anon, authenticated;
grant insert, delete on public.poll_options to authenticated;
grant select, insert on public.poll_votes to authenticated;

-- =============================================================================
-- 5. Anti-tamper triggers + profile read policy
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

drop policy if exists "Public can read verified organization flags" on public.profiles;
create policy "Public can read verified organization flags"
  on public.profiles for select
  to anon, authenticated
  using (is_verified_organization = true);

notify pgrst, 'reload schema';
