-- APE Supabase MVP schema

create table if not exists public.teams (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  color text,
  created_at_ms bigint,
  created_at timestamptz default now()
);

create table if not exists public.athletes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  nk text,
  tier text,
  sport text,
  position text,
  age integer,
  gender text,
  grade text,
  team_id text,
  grad_year integer,
  notes text,
  athlete_email text,
  parent_email text,
  club text,
  level_label text,
  bodyweight numeric,
  training_age numeric,
  created_at_ms bigint,
  created_at timestamptz default now()
);

create table if not exists public.evaluations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  athlete_id text not null references public.athletes(id) on delete cascade,
  ts bigint,
  date_label text,
  raw jsonb default '{}'::jsonb,
  scores jsonb default '{}'::jsonb,
  bucket integer,
  bucket_name text,
  deficiency_type text,
  focus text,
  count_metrics integer,
  ape_score integer,
  note text,
  verified boolean default false,
  timing_method text,
  verification jsonb default '{}'::jsonb,
  tester_name text,
  event_name text,
  created_at timestamptz default now()
);

create table if not exists public.coach_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  coach_name text,
  gym_name text,
  tagline text,
  contact text,
  logo_base64 text,
  settings jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.teams enable row level security;
alter table public.athletes enable row level security;
alter table public.evaluations enable row level security;
alter table public.coach_settings enable row level security;

create policy if not exists "teams owner access" on public.teams
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "athletes owner access" on public.athletes
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "evaluations owner access" on public.evaluations
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "coach_settings owner access" on public.coach_settings
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists idx_athletes_user_id on public.athletes(user_id);
create index if not exists idx_athletes_athlete_email on public.athletes(lower(athlete_email));
create index if not exists idx_athletes_parent_email on public.athletes(lower(parent_email));
create index if not exists idx_evaluations_athlete_id on public.evaluations(athlete_id);
