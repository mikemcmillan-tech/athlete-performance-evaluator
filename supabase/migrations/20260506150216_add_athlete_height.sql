-- Add athlete height support for the browser client profile fields.
-- Created manually because Supabase CLI is not installed in the local environment.

alter table public.athletes
  add column if not exists height text;
