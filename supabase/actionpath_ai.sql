-- ActionPath AI — per-user rate limiting (service role / edge function only)
-- Run in Supabase SQL Editor. Safe to re-run.

create table if not exists public.actionpath_ai_usage (
  user_id uuid primary key references auth.users (id) on delete cascade,
  window_start timestamptz not null default now(),
  request_count int not null default 0,
  last_request_at timestamptz not null default now()
);

create index if not exists idx_actionpath_ai_usage_last_request
  on public.actionpath_ai_usage (last_request_at desc);

alter table public.actionpath_ai_usage enable row level security;

drop policy if exists "Block anon access to actionpath ai usage" on public.actionpath_ai_usage;
create policy "Block anon access to actionpath ai usage"
  on public.actionpath_ai_usage for all
  to anon
  using (false)
  with check (false);

drop policy if exists "Block authenticated direct access to actionpath ai usage" on public.actionpath_ai_usage;
create policy "Block authenticated direct access to actionpath ai usage"
  on public.actionpath_ai_usage for all
  to authenticated
  using (false)
  with check (false);

comment on table public.actionpath_ai_usage is
  'Rate limits for ActionPath AI edge function (service role access only).';
