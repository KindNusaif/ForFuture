-- One-time fix if actionpath_ai_usage was created with last_request_at NOT NULL DEFAULT now()
-- Run in Supabase SQL Editor, then redeploy actionpath-ai.

alter table public.actionpath_ai_usage
  alter column last_request_at drop not null;

alter table public.actionpath_ai_usage
  alter column last_request_at drop default;

alter table public.actionpath_ai_usage
  alter column request_count set default 0;

-- Reset limits after testing (safe to run; only affects ActionPath AI usage rows)
update public.actionpath_ai_usage
set last_request_at = null, request_count = 0, window_start = now();
