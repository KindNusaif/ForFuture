-- ForFuture Phase 3: onboarding preferences + in-app notifications
-- Run in Supabase SQL Editor after movement_follows.sql and content_reports.sql
-- Safe to re-run.

-- =============================================================================
-- Profile onboarding fields
-- =============================================================================

alter table public.profiles add column if not exists onboarding_completed_at timestamptz;
alter table public.profiles add column if not exists onboarding_skipped_at timestamptz;
alter table public.profiles add column if not exists preferred_causes jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists participation_preferences jsonb not null default '[]'::jsonb;

comment on column public.profiles.preferred_causes is 'Onboarding cause keys, e.g. ["education","environment"]';
comment on column public.profiles.participation_preferences is 'Onboarding prefs, e.g. ["support","volunteer","petition","raise"]';

-- Existing users: treat as already onboarded (do not force wizard on deploy)
update public.profiles
set onboarding_completed_at = coalesce(onboarding_completed_at, created_at)
where onboarding_completed_at is null
  and onboarding_skipped_at is null;

-- =============================================================================
-- Notifications
-- =============================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (
    type in (
      'movement_update',
      'petition_milestone',
      'movement_new_supporter',
      'volunteer_interest',
      'movement_milestone'
    )
  ),
  title text not null,
  message text not null,
  entity_type text not null default 'movement' check (entity_type in ('movement', 'petition', 'poll')),
  entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);

create index if not exists idx_notifications_user_unread
  on public.notifications (user_id)
  where is_read = false;

alter table public.notifications enable row level security;

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users update own notification read state" on public.notifications;
create policy "Users update own notification read state"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Inserts via service role / triggers later; allow authenticated self-insert for dev seeding only if needed:
drop policy if exists "Service insert notifications" on public.notifications;
-- No client insert policy by default — notifications should be created by triggers or admin tools.

grant select, update on public.notifications to authenticated;

notify pgrst, 'reload schema';
