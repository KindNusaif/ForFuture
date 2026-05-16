-- Option 3: private.posts + security_invoker public views
-- Clears "Security Definer View" lint while keeping Youth Voice column masking.
-- Run AFTER youth_voice_privacy.sql / 00_fix_all.sql (safe to re-run).
--
-- Architecture:
--   private.posts     — base table (not exposed in PostgREST API; do not add "private" to API schemas)
--   public.posts_public_safe — masked public feed (security_invoker = true)
--   public.posts      — own-rows facade for profile + create/update/delete (security_invoker = true)

create schema if not exists private;

-- Drop views; consolidate public.posts + private.posts without duplicate-name error
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

alter table private.posts enable row level security;

-- ---------------------------------------------------------------------------
-- RLS on private.posts (invoker checks; private schema not in REST API)
-- ---------------------------------------------------------------------------

drop policy if exists "Posts are publicly readable by guests" on private.posts;
drop policy if exists "Posts are viewable by authenticated users" on private.posts;
drop policy if exists "Users can read own posts from table" on private.posts;
drop policy if exists "Posts readable via safe public view" on private.posts;
drop policy if exists "Users can create own posts" on private.posts;
drop policy if exists "Users can update own posts" on private.posts;
drop policy if exists "Users can delete own posts" on private.posts;

create policy "Posts readable via safe public view"
  on private.posts for select
  to anon, authenticated
  using (true);

create policy "Users can create own posts"
  on private.posts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own posts"
  on private.posts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own posts"
  on private.posts for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Privacy trigger on base table
-- ---------------------------------------------------------------------------

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

drop trigger if exists posts_enforce_youth_voice_privacy on public.posts;
drop trigger if exists posts_enforce_youth_voice_privacy on private.posts;
create trigger posts_enforce_youth_voice_privacy
  before insert or update on private.posts
  for each row
  execute function public.posts_enforce_youth_voice_privacy();

-- ---------------------------------------------------------------------------
-- Public feed view (security invoker — uses caller RLS on private.posts)
-- ---------------------------------------------------------------------------

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
  p.longitude
from private.posts p;

-- ---------------------------------------------------------------------------
-- Authenticated facade: own rows only (full columns for profile / create return)
-- ---------------------------------------------------------------------------

create view public.posts
with (security_invoker = true)
as
select *
from private.posts
where auth.uid() = user_id;

-- ---------------------------------------------------------------------------
-- INSTEAD OF triggers — forward writes to private.posts (RLS enforced)
-- ---------------------------------------------------------------------------

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

drop trigger if exists posts_facade_insert on public.posts;
drop trigger if exists posts_facade_update on public.posts;
drop trigger if exists posts_facade_delete on public.posts;

create trigger posts_facade_insert
  instead of insert on public.posts
  for each row execute function public.posts_facade_insert();

create trigger posts_facade_update
  instead of update on public.posts
  for each row execute function public.posts_facade_update();

create trigger posts_facade_delete
  instead of delete on public.posts
  for each row execute function public.posts_facade_delete();

-- ---------------------------------------------------------------------------
-- Privileges: invoker needs USAGE + table rights; keep private off REST API
-- ---------------------------------------------------------------------------

revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

revoke all on private.posts from public;
grant select on private.posts to anon, authenticated;
grant insert, update, delete on private.posts to authenticated;

grant select on public.posts_public_safe to anon, authenticated;
grant select, insert, update, delete on public.posts to authenticated;
