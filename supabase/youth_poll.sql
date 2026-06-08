-- Quick Youth Poll — OPTIONAL if you already ran the full 00_fix_all.sql (includes section 6).
-- Otherwise run this ENTIRE file from line 1 (creates private schema first).
-- Poll container = post with movement_type 'quick_youth_poll' (post.id is the poll id)

-- =============================================================================
-- 0. Prerequisites — private schema + private.posts + public views
-- =============================================================================

create schema if not exists private;

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

do $$
begin
  if not exists (
    select 1 from pg_tables where schemaname = 'private' and tablename = 'posts'
  ) then
    raise exception
      'private.posts does not exist. Run supabase/00_fix_all.sql first (creates profiles + posts), then re-run this script.';
  end if;
end;
$$;

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
  p.location_name, p.latitude, p.longitude
from private.posts p;

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

revoke all on schema private from public;
grant usage on schema private to anon, authenticated;
revoke all on private.posts from public;
grant select on private.posts to anon, authenticated;
grant insert, update, delete on private.posts to authenticated;
grant select on public.posts_public_safe to anon, authenticated;
grant select, insert, update, delete on public.posts to authenticated;

-- =============================================================================
-- 1. Allow new movement type on private.posts
-- =============================================================================

alter table private.posts drop constraint if exists posts_movement_type_check;
alter table private.posts add constraint posts_movement_type_check check (
  movement_type in (
    'idea_for_change',
    'raise_voice',
    'volunteer_drive',
    'fundraising',
    'peaceful_civic_action',
    'quick_youth_poll'
  )
);

-- ---------------------------------------------------------------------------
-- 2. poll_options — public read; creators insert when creating a poll post
-- ---------------------------------------------------------------------------

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references private.posts (id) on delete cascade,
  option_text text not null check (char_length(trim(option_text)) > 0),
  sort_order smallint not null default 0,
  vote_count integer not null default 0 check (vote_count >= 0),
  created_at timestamptz not null default now()
);

create index if not exists poll_options_post_id_idx on public.poll_options (post_id);

-- ---------------------------------------------------------------------------
-- 3. poll_votes — one vote per user per poll (unique constraint)
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- 4. Maintain vote_count on poll_options (trigger)
-- ---------------------------------------------------------------------------

create or replace function public.poll_vote_after_insert()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not exists (
    select 1 from public.poll_options
    where id = new.option_id and post_id = new.post_id
  ) then
    raise exception 'Invalid option for this poll';
  end if;

  update public.poll_options
  set vote_count = vote_count + 1
  where id = new.option_id;

  return new;
end;
$$;

revoke all on function public.poll_vote_after_insert() from public;
revoke all on function public.poll_vote_after_insert() from anon, authenticated;

drop trigger if exists poll_vote_after_insert on public.poll_votes;
create trigger poll_vote_after_insert
  after insert on public.poll_votes
  for each row execute function public.poll_vote_after_insert();

-- ---------------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

drop policy if exists "Poll options are publicly readable" on public.poll_options;
create policy "Poll options are publicly readable"
  on public.poll_options for select
  to anon, authenticated
  using (true);

drop policy if exists "Poll creators can add options" on public.poll_options;
create policy "Poll creators can add options"
  on public.poll_options for insert
  to authenticated
  with check (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "Poll owners can delete options" on public.poll_options;
create policy "Poll owners can delete options"
  on public.poll_options for delete
  to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "Users can read own poll votes" on public.poll_votes;
create policy "Users can read own poll votes"
  on public.poll_votes for select
  to authenticated
  using (voter_user_id = auth.uid());

drop policy if exists "Authenticated users can vote once per poll" on public.poll_votes;
create policy "Authenticated users can vote once per poll"
  on public.poll_votes for insert
  to authenticated
  with check (
    voter_user_id = auth.uid()
    and exists (
      select 1 from public.poll_options o
      where o.id = option_id and o.post_id = post_id
    )
    and exists (
      select 1 from private.posts p
      where p.id = post_id and p.movement_type = 'quick_youth_poll'
    )
  );

grant select on public.poll_options to anon, authenticated;
grant insert, delete on public.poll_options to authenticated;
grant select, insert on public.poll_votes to authenticated;
