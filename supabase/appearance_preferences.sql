-- Personalized Viewing Experience — profile appearance preferences
-- Run in Supabase SQL Editor after profiles table exists.

alter table public.profiles
  add column if not exists appearance_mode text not null default 'system',
  add column if not exists visual_comfort_enabled boolean not null default false,
  add column if not exists reduce_motion_enabled boolean not null default false;

alter table public.profiles
  drop constraint if exists profiles_appearance_mode_check;

alter table public.profiles
  add constraint profiles_appearance_mode_check
  check (appearance_mode in ('light', 'dark', 'system'));

comment on column public.profiles.appearance_mode is 'User theme: light, dark, or system';
comment on column public.profiles.visual_comfort_enabled is 'Softer surfaces for long reading';
comment on column public.profiles.reduce_motion_enabled is 'Minimize non-essential motion';
