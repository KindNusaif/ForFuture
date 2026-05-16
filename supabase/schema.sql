-- ForFuture schema
-- Run in Supabase SQL Editor

create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  youth_voice_id text unique not null,
  created_at timestamptz not null default now(),
  is_verified_organization boolean not null default false,
  organization_verification_type text check (
    organization_verification_type is null
    or organization_verification_type in (
      'ngo', 'student_society', 'community_partner', 'official_organization'
    )
  ),
  verified_at timestamptz
);

create table if not exists private.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  author_name text not null,
  posting_identity text not null default 'profile'
    check (posting_identity in ('profile', 'youth_voice')),
  youth_voice_id text,
  movement_type text not null default 'idea_for_change'
    check (movement_type in (
      'idea_for_change', 'raise_voice', 'volunteer_drive', 'fundraising', 'peaceful_civic_action',
      'quick_youth_poll'
    )),
  proposed_solution text,
  expected_impact text,
  issue_summary text,
  desired_change text,
  event_date date,
  event_time text,
  location text,
  volunteer_slots integer,
  contact_note text,
  fundraising_goal_amount numeric(12, 2),
  fundraising_purpose text,
  beneficiary_description text,
  current_raised_amount numeric(12, 2) default 0,
  action_date date,
  action_time text,
  action_location text,
  action_purpose text,
  safety_note text,
  location_name text,
  latitude double precision,
  longitude double precision,
  is_trusted_campaign boolean not null default false,
  trusted_campaign_type text check (
    trusted_campaign_type is null
    or trusted_campaign_type in (
      'fundraising', 'volunteer_drive', 'civic_action', 'general_campaign'
    )
  ),
  trusted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.supports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references private.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

alter table public.profiles enable row level security;
alter table private.posts enable row level security;
alter table public.supports enable row level security;

-- Profiles (own row only — prevents Youth Voice ID → real name lookup)
create policy "Users can read own profile"
  on public.profiles for select to authenticated using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

create policy "Public can read verified organization flags"
  on public.profiles for select
  to anon, authenticated
  using (is_verified_organization = true);

-- private.posts: invoker RLS; base table not exposed via REST (keep "private" out of API schemas)
create policy "Posts readable via safe public view"
  on private.posts for select to anon, authenticated using (true);

create policy "Users can create own posts"
  on private.posts for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own posts"
  on private.posts for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own posts"
  on private.posts for delete to authenticated using (auth.uid() = user_id);

-- Supports (authenticated + anonymous guests can read counts)
create policy "Supports are viewable by authenticated users"
  on public.supports for select to authenticated using (true);

create policy "Supports are publicly readable by guests"
  on public.supports for select to anon using (true);

create policy "Users can add support"
  on public.supports for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can remove own support"
  on public.supports for delete to authenticated using (auth.uid() = user_id);

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

create trigger posts_enforce_youth_voice_privacy
  before insert or update on private.posts
  for each row
  execute function public.posts_enforce_youth_voice_privacy();

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

create trigger profiles_block_verification_self_update
  before update on public.profiles
  for each row execute function public.profiles_block_verification_self_update();

create trigger posts_block_trusted_self_update
  before update on private.posts
  for each row execute function public.posts_block_trusted_self_update();

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

create view public.posts
with (security_invoker = true)
as
select *
from private.posts
where auth.uid() = user_id;

create or replace function public.posts_facade_insert()
returns trigger
language plpgsql
set search_path = pg_catalog, private, public
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
  update private.posts
  set
    title = new.title,
    description = new.description,
    category = new.category,
    author_name = new.author_name,
    posting_identity = new.posting_identity,
    youth_voice_id = new.youth_voice_id,
    movement_type = new.movement_type,
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

create or replace function public.posts_facade_delete()
returns trigger
language plpgsql
set search_path = pg_catalog, private, public
as $$
begin
  delete from private.posts where id = old.id;
  if not found then
    raise exception 'Post not found or not authorized';
  end if;
  return old;
end;
$$;

create trigger posts_facade_insert
  instead of insert on public.posts
  for each row execute function public.posts_facade_insert();

create trigger posts_facade_update
  instead of update on public.posts
  for each row execute function public.posts_facade_update();

create trigger posts_facade_delete
  instead of delete on public.posts
  for each row execute function public.posts_facade_delete();

revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

revoke all on private.posts from public;
grant select on private.posts to anon, authenticated;
grant insert, update, delete on private.posts to authenticated;

grant select on public.posts_public_safe to anon, authenticated;
grant select, insert, update, delete on public.posts to authenticated;
