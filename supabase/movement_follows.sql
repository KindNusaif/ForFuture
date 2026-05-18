-- ForFuture: follow movements (causes), not users.
-- movement_id references private.posts.id (each post is a movement).
-- Safe to re-run.

create table if not exists public.movement_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  movement_id uuid not null references private.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, movement_id)
);

create index if not exists idx_movement_follows_user_id
  on public.movement_follows (user_id);

create index if not exists idx_movement_follows_movement_id
  on public.movement_follows (movement_id);

create index if not exists idx_movement_follows_created_at
  on public.movement_follows (created_at desc);

-- Public aggregate counts (no user ids exposed in API usage pattern)
create or replace view public.movement_follower_counts as
select
  movement_id,
  count(*)::int as follower_count
from public.movement_follows
group by movement_id;

grant select on public.movement_follower_counts to anon, authenticated;

alter table public.movement_follows enable row level security;

drop policy if exists "Movement follows readable for counts and own rows" on public.movement_follows;
create policy "Movement follows readable for counts and own rows"
  on public.movement_follows for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can follow movements" on public.movement_follows;
create policy "Users can follow movements"
  on public.movement_follows for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can unfollow own follows" on public.movement_follows;
create policy "Users can unfollow own follows"
  on public.movement_follows for delete
  to authenticated
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
