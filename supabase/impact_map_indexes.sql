-- ForFuture Impact Map — query performance indexes
-- Safe to re-run. Run after performance_indexes.sql if both exist.

-- Map feed filters by movement_type + sort by created_at
create index if not exists idx_posts_impact_map_feed
  on private.posts (movement_type, created_at desc)
  where movement_type in ('volunteer_drive', 'peaceful_civic_action', 'raise_voice');

-- Posts with precise coordinates (map pins)
create index if not exists idx_posts_has_coordinates
  on private.posts (latitude, longitude)
  where latitude is not null and longitude is not null;

-- Volunteer event dates
create index if not exists idx_posts_volunteer_event_date
  on private.posts (event_date)
  where movement_type = 'volunteer_drive';

-- Civic action dates
create index if not exists idx_posts_civic_action_date
  on private.posts (action_date)
  where movement_type = 'peaceful_civic_action';

-- Optional district column for future explicit filtering
alter table private.posts add column if not exists district text;

create index if not exists idx_posts_district
  on private.posts (district)
  where district is not null;

analyze private.posts;
