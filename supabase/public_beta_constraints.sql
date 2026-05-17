-- ForFuture public beta: duplicate-prevention constraints
-- Run in Supabase SQL Editor after core schema exists.
-- Safe to re-run.

-- Poll votes: one vote per user per poll
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'poll_votes'
      and column_name = 'post_id'
  ) then
    if not exists (
      select 1 from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      where t.relname = 'poll_votes'
        and c.contype = 'u'
        and pg_get_constraintdef(c.oid) like '%post_id%voter_user_id%'
    ) then
      alter table public.poll_votes
        add constraint poll_votes_post_id_voter_user_id_key unique (post_id, voter_user_id);
    end if;
  else
    raise notice 'Skipping poll_votes constraint — table missing or has no post_id column. Run fix_missing_features.sql first.';
  end if;
exception when duplicate_object then null;
end;
$$;

-- Petition signatures: one signature per user per petition
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'petition_signatures'
      and column_name = 'petition_id'
  ) then
    if not exists (
      select 1 from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      where t.relname = 'petition_signatures'
        and c.contype = 'u'
        and pg_get_constraintdef(c.oid) like '%petition_id%supporter_user_id%'
    ) then
      alter table public.petition_signatures
        add constraint petition_signatures_petition_id_supporter_user_id_key
        unique (petition_id, supporter_user_id);
    end if;
  else
    raise notice 'Skipping petition_signatures constraint — run youth_petition.sql or fix_missing_features.sql first.';
  end if;
exception when duplicate_object then null;
end;
$$;

-- Content reports: one report per user per content item
do $$
begin
  if exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = 'content_reports'
  ) then
    if not exists (
      select 1 from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      where t.relname = 'content_reports'
        and c.contype = 'u'
        and pg_get_constraintdef(c.oid) like '%reporter_user_id%content_type%content_id%'
    ) then
      alter table public.content_reports
        add constraint content_reports_reporter_content_unique
        unique (reporter_user_id, content_type, content_id);
    end if;
  end if;
exception when duplicate_object then null;
end;
$$;

-- Post actions: one participation row per user per post
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'post_actions'
      and column_name = 'post_id'
  ) then
    if not exists (
      select 1 from pg_constraint
      where conname = 'post_actions_post_id_user_id_key'
        and conrelid = 'public.post_actions'::regclass
    ) then
      alter table public.post_actions
        add constraint post_actions_post_id_user_id_key unique (post_id, user_id);
    end if;
  else
    raise notice 'Skipping post_actions constraint — run post_actions.sql first.';
  end if;
exception when duplicate_object then null;
end;
$$;

notify pgrst, 'reload schema';
