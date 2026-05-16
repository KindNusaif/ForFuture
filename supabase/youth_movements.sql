-- Youth Movement types migration
-- Run AFTER youth_voice_id.sql and youth_voice_privacy.sql

-- ---------------------------------------------------------------------------
-- 1. movement_type + optional fields on posts
-- ---------------------------------------------------------------------------

alter table public.posts
  add column if not exists movement_type text not null default 'idea_for_change';

alter table public.posts
  drop constraint if exists posts_movement_type_check;

alter table public.posts
  add constraint posts_movement_type_check
  check (
    movement_type in (
      'idea_for_change',
      'raise_voice',
      'volunteer_drive',
      'fundraising',
      'peaceful_civic_action',
      'quick_youth_poll'
    )
  );

-- Idea for Change
alter table public.posts add column if not exists proposed_solution text;
alter table public.posts add column if not exists expected_impact text;

-- Raise Your Voice
alter table public.posts add column if not exists issue_summary text;
alter table public.posts add column if not exists desired_change text;

-- Volunteer Drive
alter table public.posts add column if not exists event_date date;
alter table public.posts add column if not exists event_time text;
alter table public.posts add column if not exists location text;
alter table public.posts add column if not exists volunteer_slots integer;
alter table public.posts add column if not exists contact_note text;

-- Fundraising Campaign
alter table public.posts add column if not exists fundraising_goal_amount numeric(12, 2);
alter table public.posts add column if not exists fundraising_purpose text;
alter table public.posts add column if not exists beneficiary_description text;
alter table public.posts add column if not exists current_raised_amount numeric(12, 2) default 0;

-- Peaceful Civic Action
alter table public.posts add column if not exists action_date date;
alter table public.posts add column if not exists action_time text;
alter table public.posts add column if not exists action_location text;
alter table public.posts add column if not exists action_purpose text;
alter table public.posts add column if not exists safety_note text;

update public.posts set movement_type = 'idea_for_change' where movement_type is null;

-- ---------------------------------------------------------------------------
-- 2. Fundraising must use profile identity (extend privacy trigger)
-- ---------------------------------------------------------------------------

create or replace function public.posts_enforce_youth_voice_privacy()
returns trigger
language plpgsql
set search_path = pg_catalog, public
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

-- ---------------------------------------------------------------------------
-- 3. Refresh public safe view (includes movement fields)
-- ---------------------------------------------------------------------------

-- View recreated in fix_posts_private_schema.sql (private.posts + security_invoker)
