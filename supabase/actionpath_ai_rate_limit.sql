-- ActionPath AI — per-user rate limiting (service role / edge function only)
-- Run in Supabase SQL Editor before deploying the actionpath-ai edge function.

create table if not exists public.actionpath_ai_usage (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Set only after a successful AI response (cooldown between successes).
  last_request_at timestamptz,
  window_start timestamptz not null default now(),
  request_count int not null default 0
);

-- If the table already exists with NOT NULL last_request_at, run once in SQL Editor:
-- alter table public.actionpath_ai_usage alter column last_request_at drop not null;
-- alter table public.actionpath_ai_usage alter column last_request_at drop default;
-- alter table public.actionpath_ai_usage alter column request_count set default 0;

alter table public.actionpath_ai_usage enable row level security;

-- No policies: authenticated clients cannot read/write; edge function uses service role.

create index if not exists idx_actionpath_ai_usage_last_request
  on public.actionpath_ai_usage (last_request_at desc);

-- Atomic check/record helpers (run actionpath_ai_rpc.sql for function bodies)
-- \i actionpath_ai_rpc.sql
