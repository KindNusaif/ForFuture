-- ForFuture: civic-action engagement (replaces generic supports for movement posts)
-- Safe to re-run. Run after fix_publish_movement.sql if posts live in private.posts.

-- =============================================================================
-- 1. post_actions table
-- =============================================================================

create table if not exists public.post_actions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references private.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  action_type text not null check (
    action_type in (
      'support_idea',
      'stand_with_voice',
      'volunteer_interest',
      'fundraising_support',
      'join_cause'
    )
  ),
  created_at timestamptz not null default now(),
  unique (post_id, user_id, action_type),
  unique (post_id, user_id)
);

create index if not exists idx_post_actions_post_id
  on public.post_actions (post_id);

create index if not exists idx_post_actions_user_id
  on public.post_actions (user_id);

create index if not exists idx_post_actions_action_type
  on public.post_actions (action_type);

create index if not exists idx_post_actions_created_at
  on public.post_actions (created_at desc);

create index if not exists idx_post_actions_post_action
  on public.post_actions (post_id, action_type);

-- One participation per user per post (each post has a single movement type)
-- =============================================================================
-- 2. Migrate existing supports (if table exists)
-- =============================================================================

do $$
begin
  if exists (
    select 1 from pg_tables where schemaname = 'public' and tablename = 'supports'
  ) then
    insert into public.post_actions (post_id, user_id, action_type, created_at)
    select
      s.post_id,
      s.user_id,
      case p.movement_type
        when 'idea_for_change' then 'support_idea'
        when 'raise_voice' then 'stand_with_voice'
        when 'volunteer_drive' then 'volunteer_interest'
        when 'fundraising' then 'fundraising_support'
        when 'peaceful_civic_action' then 'join_cause'
        else 'support_idea'
      end,
      s.created_at
    from public.supports s
    inner join private.posts p on p.id = s.post_id
    where p.movement_type <> 'quick_youth_poll'
    on conflict (post_id, user_id) do nothing;
  end if;
end;
$$;

-- =============================================================================
-- 3. RLS
-- =============================================================================

alter table public.post_actions enable row level security;

drop policy if exists "Post actions readable by authenticated" on public.post_actions;
create policy "Post actions readable by authenticated"
  on public.post_actions for select to authenticated using (true);

drop policy if exists "Post actions publicly readable by guests" on public.post_actions;
create policy "Post actions publicly readable by guests"
  on public.post_actions for select to anon using (true);

drop policy if exists "Users can add own post action" on public.post_actions;
create policy "Users can add own post action"
  on public.post_actions for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove own post action" on public.post_actions;
create policy "Users can remove own post action"
  on public.post_actions for delete to authenticated
  using (auth.uid() = user_id);

grant select on public.post_actions to anon, authenticated;
grant insert, delete on public.post_actions to authenticated;

-- =============================================================================
-- 4. Optional: ensure supports FK still valid (legacy table kept for rollback)
-- =============================================================================

do $$
begin
  if exists (
    select 1 from pg_tables where schemaname = 'public' and tablename = 'supports'
  ) then
    alter table public.supports drop constraint if exists supports_post_id_fkey;
    alter table public.supports
      add constraint supports_post_id_fkey
      foreign key (post_id) references private.posts (id) on delete cascade;
  end if;
exception when others then
  null;
end;
$$;

analyze public.post_actions;

notify pgrst, 'reload schema';
