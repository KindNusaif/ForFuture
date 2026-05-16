-- ActionPath AI — per-user rate limiting (service role / edge function only)
-- Run in Supabase SQL Editor before deploying the actionpath-ai edge function.

create table if not exists public.actionpath_ai_usage (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_request_at timestamptz not null default now(),
  window_start timestamptz not null default now(),
  request_count int not null default 1
);

alter table public.actionpath_ai_usage enable row level security;

-- No policies: authenticated clients cannot read/write; edge function uses service role.

create index if not exists idx_actionpath_ai_usage_last_request
  on public.actionpath_ai_usage (last_request_at desc);
