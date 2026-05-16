-- Fix: ERROR 23514 posts_movement_type_check violated by some row
-- Run this in Supabase SQL Editor BEFORE re-running fix_database.sql (or alone to unblock).
-- Safe to re-run.

-- 1) See offending values (optional — run alone to inspect)
-- select movement_type, count(*) from private.posts group by 1 order by 2 desc;

-- 2) Normalize legacy / invalid values
update private.posts set movement_type = 'youth_petition'
  where movement_type in ('petition', 'youth petition');

update private.posts set movement_type = 'quick_youth_poll'
  where movement_type in ('poll', 'quick_poll', 'youth_poll');

update private.posts set movement_type = 'peaceful_civic_action'
  where movement_type in ('civic_action', 'peaceful_action', 'civic');

update private.posts set movement_type = 'idea_for_change'
  where movement_type is null
     or trim(movement_type) = ''
     or movement_type not in (
       'idea_for_change',
       'raise_voice',
       'volunteer_drive',
       'fundraising',
       'peaceful_civic_action',
       'quick_youth_poll',
       'youth_petition',
       'donation_relief'
     );

-- 3) Re-apply constraint with full allowed list
alter table private.posts drop constraint if exists posts_movement_type_check;

alter table private.posts add constraint posts_movement_type_check check (
  movement_type in (
    'idea_for_change',
    'raise_voice',
    'volunteer_drive',
    'fundraising',
    'peaceful_civic_action',
    'quick_youth_poll',
    'youth_petition'
  )
);

notify pgrst, 'reload schema';
