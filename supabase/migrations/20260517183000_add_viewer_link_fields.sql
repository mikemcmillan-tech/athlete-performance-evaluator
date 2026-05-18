alter table public.athletes
  add column if not exists athlete_email text,
  add column if not exists parent_email text,
  add column if not exists club text,
  add column if not exists level_label text;

create index if not exists idx_athletes_athlete_email on public.athletes(lower(athlete_email));
create index if not exists idx_athletes_parent_email on public.athletes(lower(parent_email));
