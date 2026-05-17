-- ForFuture public beta: extend reportable content types
-- Run after content_reports.sql. Safe to re-run.

alter table public.content_reports
  drop constraint if exists content_reports_content_type_check;

alter table public.content_reports
  add constraint content_reports_content_type_check check (
    content_type in (
      'movement',
      'poll',
      'petition',
      'volunteer_drive',
      'fundraising',
      'campaign',
      'relief',
      'comment'
    )
  );

notify pgrst, 'reload schema';
