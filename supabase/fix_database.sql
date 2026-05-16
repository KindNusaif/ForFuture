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
    movement_type, proposed_solution, expected_impact, issue_summary, desired_change,
    event_date, event_time, location, volunteer_slots, contact_note,
    fundraising_goal_amount, fundraising_purpose, beneficiary_description, current_raised_amount,
    action_date, action_time, action_location, action_purpose, safety_note,
    location_name, latitude, longitude
  ) values (
    new.user_id, new.title, new.description, new.category, new.author_name,
    new.posting_identity, new.youth_voice_id, new.movement_type,
    new.proposed_solution, new.expected_impact, new.issue_summary, new.desired_change,
    new.event_date, new.event_time, new.location, new.volunteer_slots, new.contact_note,
    new.fundraising_goal_amount, new.fundraising_purpose, new.beneficiary_description,
    coalesce(new.current_raised_amount, 0),
    new.action_date, new.action_time, new.action_location, new.action_purpose, new.safety_note,
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
    safety_note = new.safety_note, location_name = new.location_name,
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
