-- =============================================================================
-- ForFuture: APPLY ALL MIGRATIONS (one run in Supabase SQL Editor)
-- Safe to re-run (idempotent). Run top to bottom, then hard-refresh the app.
-- =============================================================================


-- ########## fix_database.sql ##########

-- =============================================================================
-- ForFuture: COMPLETE DATABASE FIX (run this ENTIRE file once)
-- Supabase Dashboard → SQL Editor → paste → Run
-- Then refresh the app (Ctrl+Shift+R)
-- Safe to re-run (idempotent)
-- =============================================================================

-- ForFuture: fix "publish movement" / missing column errors (production-safe, idempotent)
-- Run this ENTIRE file in Supabase Dashboard â†’ SQL Editor, then refresh the app.
--
-- Fixes:
--   â€¢ private.posts missing movement_type, youth_voice_id, map fields, trust columns
--   â€¢ profiles missing youth_voice_id
--   â€¢ public.posts facade + posts_public_safe views out of date
--
-- After this, polls/trust extras: run supabase/fix_missing_features.sql

create schema if not exists private;

-- =============================================================================
-- 1. profiles.youth_voice_id
-- =============================================================================

alter table public.profiles add column if not exists youth_voice_id text;

create or replace function public.generate_youth_voice_id()
returns text
language plpgsql
set search_path = pg_catalog
as $$
declare
  chars text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  result text;
  i int;
begin
  result := 'YV-';
  for i in 1..5 loop
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return result;
end;
$$;

do $$
declare r record; candidate text; attempts int;
begin
  for r in select id from public.profiles where youth_voice_id is null loop
    attempts := 0;
    loop
      candidate := public.generate_youth_voice_id();
      begin
        update public.profiles set youth_voice_id = candidate
        where id = r.id and youth_voice_id is null;
        exit;
      exception when unique_violation then
        attempts := attempts + 1;
        if attempts > 20 then
          raise exception 'Could not assign youth_voice_id for profile %', r.id;
        end if;
      end;
    end loop;
  end loop;
end;
$$;

do $$
begin
  if exists (
    select 1 from public.profiles where youth_voice_id is null limit 1
  ) then
    null;
  else
    alter table public.profiles alter column youth_voice_id set not null;
  end if;
exception when others then
  null;
end;
$$;

create unique index if not exists profiles_youth_voice_id_key on public.profiles (youth_voice_id);

-- =============================================================================
-- 2. Consolidate posts into private.posts (if needed)
-- =============================================================================

do $$
declare
  has_public_posts_table boolean;
  has_private_posts_table boolean;
  private_row_count bigint;
begin
  if exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'posts_public_safe' and c.relkind = 'v'
  ) then
    execute 'drop view public.posts_public_safe';
  end if;

  if exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'posts' and c.relkind = 'v'
  ) then
    execute 'drop view public.posts cascade';
  end if;

  select exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'posts' and c.relkind = 'r'
  ) into has_public_posts_table;

  select exists (
    select 1 from pg_tables where schemaname = 'private' and tablename = 'posts'
  ) into has_private_posts_table;

  if has_public_posts_table and has_private_posts_table then
    select count(*) into private_row_count from private.posts;
    if private_row_count = 0 then
      drop table private.posts;
      alter table public.posts set schema private;
    else
      execute 'drop table public.posts cascade';
    end if;
  elsif has_public_posts_table and not has_private_posts_table then
    alter table public.posts set schema private;
  end if;
end;
$$;

create table if not exists private.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  author_name text not null,
  created_at timestamptz not null default now()
);

-- Core movement / privacy columns
alter table private.posts add column if not exists posting_identity text not null default 'profile';
alter table private.posts add column if not exists youth_voice_id text;
alter table private.posts add column if not exists movement_type text not null default 'idea_for_change';

alter table private.posts add column if not exists proposed_solution text;
alter table private.posts add column if not exists expected_impact text;
alter table private.posts add column if not exists issue_summary text;
alter table private.posts add column if not exists desired_change text;
alter table private.posts add column if not exists event_date date;
alter table private.posts add column if not exists event_time text;
alter table private.posts add column if not exists location text;
alter table private.posts add column if not exists volunteer_slots integer;
alter table private.posts add column if not exists contact_note text;
alter table private.posts add column if not exists fundraising_goal_amount numeric(12, 2);
alter table private.posts add column if not exists fundraising_purpose text;
alter table private.posts add column if not exists beneficiary_description text;
alter table private.posts add column if not exists current_raised_amount numeric(12, 2) default 0;
alter table private.posts add column if not exists action_date date;
alter table private.posts add column if not exists action_time text;
alter table private.posts add column if not exists action_location text;
alter table private.posts add column if not exists action_purpose text;
alter table private.posts add column if not exists safety_note text;
alter table private.posts add column if not exists location_name text;
alter table private.posts add column if not exists latitude double precision;
alter table private.posts add column if not exists longitude double precision;

alter table private.posts
  add column if not exists is_trusted_campaign boolean not null default false;
alter table private.posts add column if not exists trusted_campaign_type text;
alter table private.posts add column if not exists trusted_at timestamptz;

update private.posts set movement_type = 'idea_for_change' where movement_type is null;
update private.posts set posting_identity = 'profile' where posting_identity is null;

-- Normalize legacy/invalid movement_type values before check constraint (avoids 23514)
update private.posts set movement_type = 'youth_petition'
  where movement_type in ('petition', 'youth petition');
update private.posts set movement_type = 'quick_youth_poll'
  where movement_type in ('poll', 'quick_poll', 'youth_poll');
update private.posts set movement_type = 'peaceful_civic_action'
  where movement_type in ('civic_action', 'peaceful_action', 'civic');
update private.posts set movement_type = 'idea_for_change'
  where trim(coalesce(movement_type, '')) = ''
     or movement_type not in (
       'idea_for_change',
       'raise_voice',
       'volunteer_drive',
       'fundraising',
       'peaceful_civic_action',
       'quick_youth_poll',
       'youth_petition'
     );

alter table private.posts drop constraint if exists posts_posting_identity_check;
alter table private.posts add constraint posts_posting_identity_check
  check (posting_identity in ('profile', 'youth_voice'));

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

alter table private.posts drop constraint if exists posts_trusted_campaign_type_check;
alter table private.posts add constraint posts_trusted_campaign_type_check check (
  trusted_campaign_type is null
  or trusted_campaign_type in (
    'fundraising', 'volunteer_drive', 'civic_action', 'general_campaign'
  )
);

-- =============================================================================
-- 3. RLS + privacy trigger
-- =============================================================================

alter table private.posts enable row level security;

drop policy if exists "Posts readable via safe public view" on private.posts;
create policy "Posts readable via safe public view"
  on private.posts for select to anon, authenticated using (true);

drop policy if exists "Users can create own posts" on private.posts;
create policy "Users can create own posts"
  on private.posts for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own posts" on private.posts;
create policy "Users can update own posts"
  on private.posts for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own posts" on private.posts;
create policy "Users can delete own posts"
  on private.posts for delete to authenticated using (auth.uid() = user_id);

create or replace function public.posts_enforce_youth_voice_privacy()
returns trigger
language plpgsql
set search_path = pg_catalog, private, public
as $$
begin
  if new.posting_identity = 'youth_voice' then
    if new.youth_voice_id is null then
      raise exception 'youth_voice_id is required for youth_voice posts';
    end if;
    new.author_name := 'Youth Voice ' || new.youth_voice_id;
  end if;

  if new.movement_type = 'fundraising' and new.posting_identity = 'youth_voice' then
    raise exception 'Fundraising campaigns must be posted with your public profile';
  end if;

  if tg_op = 'UPDATE' and old.user_id is distinct from new.user_id then
    raise exception 'Cannot change post ownership';
  end if;

  return new;
end;
$$;

drop trigger if exists posts_enforce_youth_voice_privacy on private.posts;
create trigger posts_enforce_youth_voice_privacy
  before insert or update on private.posts
  for each row execute function public.posts_enforce_youth_voice_privacy();

-- =============================================================================
-- 4. Public views + write facade (required for app .from('posts').insert)
-- =============================================================================

alter table public.profiles
  add column if not exists is_verified_organization boolean not null default false;
alter table public.profiles
  add column if not exists organization_verification_type text;
alter table public.profiles add column if not exists verified_at timestamptz;

create view public.posts_public_safe
with (security_invoker = true)
as
select
  p.id,
  case when p.posting_identity = 'youth_voice' then null::uuid else p.user_id end as user_id,
  p.title, p.description, p.category, p.created_at, p.posting_identity,
  case
    when p.posting_identity = 'youth_voice' and p.youth_voice_id is not null then
      'Youth Voice ' || p.youth_voice_id
    else p.author_name
  end as author_name,
  case when p.posting_identity = 'youth_voice' then p.youth_voice_id else null end as youth_voice_id,
  p.movement_type,
  p.proposed_solution, p.expected_impact, p.issue_summary, p.desired_change,
  p.event_date, p.event_time, p.location, p.volunteer_slots, p.contact_note,
  p.fundraising_goal_amount, p.fundraising_purpose, p.beneficiary_description, p.current_raised_amount,
  p.action_date, p.action_time, p.action_location, p.action_purpose, p.safety_note,
  p.location_name, p.latitude, p.longitude,
  p.is_trusted_campaign, p.trusted_campaign_type, p.trusted_at,
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

create view public.posts
with (security_invoker = true)
as
select * from private.posts where auth.uid() = user_id;

create or replace function public.posts_facade_insert()
returns trigger language plpgsql set search_path = pg_catalog, private, public
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
  ) returning * into inserted;
  return inserted;
end;
$$;

create or replace function public.posts_facade_update()
returns trigger language plpgsql set search_path = pg_catalog, private, public
as $$
declare updated private.posts%rowtype;
begin
  update private.posts set
    title = new.title, description = new.description, category = new.category,
    author_name = new.author_name, posting_identity = new.posting_identity,
    youth_voice_id = new.youth_voice_id, movement_type = new.movement_type,
    donation_subtype = new.donation_subtype,
    relief_status = coalesce(new.relief_status, relief_status),
    blood_group = new.blood_group, hospital_or_organizer = new.hospital_or_organizer,
    urgency_level = new.urgency_level, donors_needed = new.donors_needed,
    needed_by_date = new.needed_by_date, item_category = new.item_category,
    items_needed = new.items_needed, quantity_needed = new.quantity_needed,
    beneficiary_group = new.beneficiary_group, collection_location = new.collection_location,
    relief_deadline = new.relief_deadline,
    organizer_transparency_note = new.organizer_transparency_note,
    proposed_solution = new.proposed_solution, expected_impact = new.expected_impact,
    issue_summary = new.issue_summary, desired_change = new.desired_change,
    event_date = new.event_date, event_time = new.event_time, location = new.location,
    volunteer_slots = new.volunteer_slots, contact_note = new.contact_note,
    fundraising_goal_amount = new.fundraising_goal_amount,
    fundraising_purpose = new.fundraising_purpose,
    beneficiary_description = new.beneficiary_description,
    current_raised_amount = coalesce(new.current_raised_amount, 0),
    action_date = new.action_date, action_time = new.action_time,
    action_location = new.action_location, action_purpose = new.action_purpose,
    safety_note = new.safety_note,
    petition_issue = new.petition_issue,
    petition_requested_change = new.petition_requested_change,
    petition_target_authority = new.petition_target_authority,
    petition_support_goal = new.petition_support_goal,
    petition_closing_date = new.petition_closing_date,
    petition_impact_note = new.petition_impact_note,
    location_name = new.location_name,
    latitude = new.latitude, longitude = new.longitude
  where id = old.id returning * into updated;
  if updated.id is null then raise exception 'Post not found or not authorized'; end if;
  return updated;
end;
$$;

create or replace function public.posts_facade_delete()
returns trigger language plpgsql set search_path = pg_catalog, private, public
as $$
begin
  delete from private.posts where id = old.id;
  if not found then raise exception 'Post not found or not authorized'; end if;
  return old;
end;
$$;

drop trigger if exists posts_facade_insert on public.posts;
drop trigger if exists posts_facade_update on public.posts;
drop trigger if exists posts_facade_delete on public.posts;

create trigger posts_facade_insert instead of insert on public.posts
  for each row execute function public.posts_facade_insert();
create trigger posts_facade_update instead of update on public.posts
  for each row execute function public.posts_facade_update();
create trigger posts_facade_delete instead of delete on public.posts
  for each row execute function public.posts_facade_delete();

grant usage on schema private to anon, authenticated;
revoke all on private.posts from public;
grant select on private.posts to anon, authenticated;
grant insert, update, delete on private.posts to authenticated;
grant select on public.posts_public_safe to anon, authenticated;
grant select, insert, update, delete on public.posts to authenticated;

notify pgrst, 'reload schema';

-- ========== polls, trust, verification ==========


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
-- 2. Movement type constraint (all movement types)
-- =============================================================================

update private.posts set movement_type = 'youth_petition'
  where movement_type in ('petition', 'youth petition');
update private.posts set movement_type = 'quick_youth_poll'
  where movement_type in ('poll', 'quick_poll', 'youth_poll');
update private.posts set movement_type = 'peaceful_civic_action'
  where movement_type in ('civic_action', 'peaceful_action', 'civic');
update private.posts set movement_type = 'idea_for_change'
  where trim(coalesce(movement_type, '')) = ''
     or movement_type not in (
       'idea_for_change',
       'raise_voice',
       'volunteer_drive',
       'fundraising',
       'peaceful_civic_action',
       'quick_youth_poll',
       'youth_petition'
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

-- ========== youth petition ==========


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

-- ========== moderation (is_admin) ==========

alter table public.profiles add column if not exists is_admin boolean not null default false;
notify pgrst, 'reload schema';

-- ########## trust_review_system.sql ##########

-- ForFuture: Trust & Verification System (production-safe, idempotent)
-- Run in Supabase SQL Editor after fix_database.sql / content_reports.sql
--
-- Separates:
--   â€¢ Organizer verification (profiles)
--   â€¢ Campaign review (private.posts)
--
-- Requires: public.is_platform_admin() from content_reports.sql

-- =============================================================================
-- 1. profiles â€” verified organizer
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
-- 2. private.posts â€” campaign review
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
-- 4. RLS â€” public read of verified organizer flags (for feed badges)
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

-- ########## donation_relief_hub.sql ##########

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
-- 3. post_actions â€” blood / item response types
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

-- ########## movement_attachments.sql ##########

-- ForFuture: movement media attachments (images + PDFs; video-ready schema)
-- Run after fix_database.sql
-- Also create storage buckets in Dashboard or via statements below.

-- =============================================================================
-- 1. Storage buckets
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('movement-images', 'movement-images', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('movement-documents', 'movement-documents', true)
on conflict (id) do update set public = true;

-- =============================================================================
-- 2. movement_attachments table
-- =============================================================================

create table if not exists public.movement_attachments (
  id uuid primary key default gen_random_uuid(),
  movement_id uuid not null references private.posts (id) on delete cascade,
  uploader_id uuid not null references public.profiles (id) on delete cascade,
  file_type text not null check (file_type in ('image', 'document')),
  media_kind text not null default 'image' check (media_kind in ('image', 'document', 'video')),
  mime_type text not null,
  storage_bucket text not null,
  storage_path text not null,
  original_file_name text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0 and file_size_bytes <= 10485760),
  display_order smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create index if not exists idx_movement_attachments_movement_id
  on public.movement_attachments (movement_id);

create index if not exists idx_movement_attachments_uploader_id
  on public.movement_attachments (uploader_id);

create index if not exists idx_movement_attachments_file_type
  on public.movement_attachments (file_type);

create index if not exists idx_movement_attachments_created_at
  on public.movement_attachments (created_at desc);

-- =============================================================================
-- 3. RLS â€” movement_attachments
-- =============================================================================

alter table public.movement_attachments enable row level security;

drop policy if exists "Movement attachments are publicly readable" on public.movement_attachments;
create policy "Movement attachments are publicly readable"
  on public.movement_attachments for select
  to anon, authenticated
  using (true);

drop policy if exists "Users insert attachments for own movements" on public.movement_attachments;
create policy "Users insert attachments for own movements"
  on public.movement_attachments for insert
  to authenticated
  with check (
    uploader_id = auth.uid()
    and exists (
      select 1 from private.posts p
      where p.id = movement_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "Users delete own attachments" on public.movement_attachments;
create policy "Users delete own attachments"
  on public.movement_attachments for delete
  to authenticated
  using (uploader_id = auth.uid());

grant select on public.movement_attachments to anon, authenticated;
grant insert, delete on public.movement_attachments to authenticated;

-- =============================================================================
-- 4. Storage policies â€” path: {userId}/{movementId}/{filename}
-- =============================================================================

drop policy if exists "Public read movement images" on storage.objects;
create policy "Public read movement images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'movement-images');

drop policy if exists "Authenticated upload movement images" on storage.objects;
create policy "Authenticated upload movement images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'movement-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owners delete movement images" on storage.objects;
create policy "Owners delete movement images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'movement-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Public read movement documents" on storage.objects;
create policy "Public read movement documents"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'movement-documents');

drop policy if exists "Authenticated upload movement documents" on storage.objects;
create policy "Authenticated upload movement documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'movement-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owners delete movement documents" on storage.objects;
create policy "Owners delete movement documents"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'movement-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

grant select on storage.objects to anon, authenticated;
grant insert, delete on storage.objects to authenticated;

notify pgrst, 'reload schema';

-- ########## youth_impact_pulse.sql ##########

-- ForFuture: Youth Impact Pulse â€” public aggregate dashboard metrics
-- Run after fix_database.sql, trust_review_system.sql, donation_relief_hub.sql
-- Safe to re-run (idempotent)

-- =============================================================================
-- RPC: single public-safe JSON payload (aggregates only â€” no PII)
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

-- ########## appearance_preferences.sql ##########

-- Personalized Viewing Experience â€” profile appearance preferences
-- Run in Supabase SQL Editor after profiles table exists.

alter table public.profiles
  add column if not exists appearance_mode text not null default 'system',
  add column if not exists visual_comfort_enabled boolean not null default false,
  add column if not exists reduce_motion_enabled boolean not null default false;

alter table public.profiles
  drop constraint if exists profiles_appearance_mode_check;

alter table public.profiles
  add constraint profiles_appearance_mode_check
  check (appearance_mode in ('light', 'dark', 'system'));

comment on column public.profiles.appearance_mode is 'User theme: light, dark, or system';
comment on column public.profiles.visual_comfort_enabled is 'Softer surfaces for long reading';
comment on column public.profiles.reduce_motion_enabled is 'Minimize non-essential motion';

-- ########## fix_posts_facade_relief.sql ##########
-- Ensures Donation & Relief inserts forward donation_subtype (see fix_posts_facade_relief.sql)

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

create or replace function public.posts_facade_update()
returns trigger
language plpgsql
set search_path = pg_catalog, private, public
as $$
declare updated private.posts%rowtype;
begin
  update private.posts set
    title = new.title,
    description = new.description,
    category = new.category,
    author_name = new.author_name,
    posting_identity = new.posting_identity,
    youth_voice_id = new.youth_voice_id,
    movement_type = new.movement_type,
    donation_subtype = new.donation_subtype,
    relief_status = coalesce(new.relief_status, relief_status),
    blood_group = new.blood_group,
    hospital_or_organizer = new.hospital_or_organizer,
    urgency_level = new.urgency_level,
    donors_needed = new.donors_needed,
    needed_by_date = new.needed_by_date,
    item_category = new.item_category,
    items_needed = new.items_needed,
    quantity_needed = new.quantity_needed,
    beneficiary_group = new.beneficiary_group,
    collection_location = new.collection_location,
    relief_deadline = new.relief_deadline,
    organizer_transparency_note = new.organizer_transparency_note,
    proposed_solution = new.proposed_solution,
    expected_impact = new.expected_impact,
    issue_summary = new.issue_summary,
    desired_change = new.desired_change,
    event_date = new.event_date,
    event_time = new.event_time,
    location = new.location,
    volunteer_slots = new.volunteer_slots,
    contact_note = new.contact_note,
    fundraising_goal_amount = new.fundraising_goal_amount,
    fundraising_purpose = new.fundraising_purpose,
    beneficiary_description = new.beneficiary_description,
    current_raised_amount = coalesce(new.current_raised_amount, 0),
    action_date = new.action_date,
    action_time = new.action_time,
    action_location = new.action_location,
    action_purpose = new.action_purpose,
    safety_note = new.safety_note,
    petition_issue = new.petition_issue,
    petition_requested_change = new.petition_requested_change,
    petition_target_authority = new.petition_target_authority,
    petition_support_goal = new.petition_support_goal,
    petition_closing_date = new.petition_closing_date,
    petition_impact_note = new.petition_impact_note,
    location_name = new.location_name,
    latitude = new.latitude,
    longitude = new.longitude
  where id = old.id
  returning * into updated;

  if updated.id is null then
    raise exception 'Post not found or not authorized';
  end if;

  return updated;
end;
$$;

notify pgrst, 'reload schema';
