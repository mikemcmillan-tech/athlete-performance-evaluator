alter table public.evaluations
  add column if not exists verified boolean default false,
  add column if not exists timing_method text,
  add column if not exists verification jsonb default '{}'::jsonb,
  add column if not exists tester_name text,
  add column if not exists event_name text;

alter table public.athletes
  add column if not exists gender text,
  add column if not exists grade text;

alter table public.coach_settings
  add column if not exists logo_base64 text;
