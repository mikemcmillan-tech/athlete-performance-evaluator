-- ══════════════════════════════════════════════════════════════
-- APE — Athlete Performance Evaluator
-- Migration: ape_schema_complete  (applied 2026-05-02)
-- ══════════════════════════════════════════════════════════════
-- This file is the source-of-truth for the Supabase schema.
-- It has already been applied to the project via Supabase MCP.
-- To re-apply manually:  paste into Supabase SQL Editor > Run
-- ══════════════════════════════════════════════════════════════

-- ─── 1. EXTEND ATHLETES ───────────────────────────────────────
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS bodyweight    numeric,
  ADD COLUMN IF NOT EXISTS training_age  numeric,
  ADD COLUMN IF NOT EXISTS nk            text;   -- normalized name key (lowercase, trimmed)

-- ─── 2. EXTEND SESSIONS ───────────────────────────────────────
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS scores       jsonb,   -- {vp,hp,rs,ac,mv,gps,ft} each 1-5
  ADD COLUMN IF NOT EXISTS raw          jsonb,   -- {vj,bj,rsi,f5,f10,gps} raw inputs
  ADD COLUMN IF NOT EXISTS bkt          integer, -- classification bucket 1-5
  ADD COLUMN IF NOT EXISTS bkt_name     text,    -- "Well Developed" etc
  ADD COLUMN IF NOT EXISTS def_type     text,    -- "Force Deficient" | "Form Deficient" | ...
  ADD COLUMN IF NOT EXISTS def_label    text,
  ADD COLUMN IF NOT EXISTS def_limiter  text,
  ADD COLUMN IF NOT EXISTS cnt          integer, -- metrics tested (1-6)
  ADD COLUMN IF NOT EXISTS session_note text;

-- ─── 3. COACH SETTINGS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coach_settings (
  coach_id    uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_name  text        NOT NULL DEFAULT '',
  gym_name    text        NOT NULL DEFAULT '',
  tagline     text        NOT NULL DEFAULT '',
  contact     text        NOT NULL DEFAULT '',
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coach_settings ENABLE ROW LEVEL SECURITY;

-- ─── 4. UPDATED_AT TRIGGER ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS athletes_updated_at ON public.athletes;
CREATE TRIGGER athletes_updated_at
  BEFORE UPDATE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS coach_settings_updated_at ON public.coach_settings;
CREATE TRIGGER coach_settings_updated_at
  BEFORE UPDATE ON public.coach_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── 5. AUTO-CREATE COACH PROFILE ON SIGNUP ──────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.coaches (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 6. RLS POLICIES ─────────────────────────────────────────
-- coaches
DROP POLICY IF EXISTS "coaches_select_own" ON public.coaches;
CREATE POLICY "coaches_select_own" ON public.coaches FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "coaches_insert_own" ON public.coaches;
CREATE POLICY "coaches_insert_own" ON public.coaches FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "coaches_update_own" ON public.coaches;
CREATE POLICY "coaches_update_own" ON public.coaches FOR UPDATE USING (auth.uid() = id);

-- teams
DROP POLICY IF EXISTS "teams_select_own" ON public.teams;
CREATE POLICY "teams_select_own" ON public.teams FOR SELECT USING (auth.uid() = coach_id);
DROP POLICY IF EXISTS "teams_insert_own" ON public.teams;
CREATE POLICY "teams_insert_own" ON public.teams FOR INSERT WITH CHECK (auth.uid() = coach_id);
DROP POLICY IF EXISTS "teams_update_own" ON public.teams;
CREATE POLICY "teams_update_own" ON public.teams FOR UPDATE USING (auth.uid() = coach_id);
DROP POLICY IF EXISTS "teams_delete_own" ON public.teams;
CREATE POLICY "teams_delete_own" ON public.teams FOR DELETE USING (auth.uid() = coach_id);

-- athletes
DROP POLICY IF EXISTS "athletes_select_own" ON public.athletes;
CREATE POLICY "athletes_select_own" ON public.athletes FOR SELECT USING (auth.uid() = coach_id);
DROP POLICY IF EXISTS "athletes_insert_own" ON public.athletes;
CREATE POLICY "athletes_insert_own" ON public.athletes FOR INSERT WITH CHECK (auth.uid() = coach_id);
DROP POLICY IF EXISTS "athletes_update_own" ON public.athletes;
CREATE POLICY "athletes_update_own" ON public.athletes FOR UPDATE USING (auth.uid() = coach_id);
DROP POLICY IF EXISTS "athletes_delete_own" ON public.athletes;
CREATE POLICY "athletes_delete_own" ON public.athletes FOR DELETE USING (auth.uid() = coach_id);

-- sessions
DROP POLICY IF EXISTS "sessions_select_own" ON public.sessions;
CREATE POLICY "sessions_select_own" ON public.sessions FOR SELECT USING (auth.uid() = coach_id);
DROP POLICY IF EXISTS "sessions_insert_own" ON public.sessions;
CREATE POLICY "sessions_insert_own" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = coach_id);
DROP POLICY IF EXISTS "sessions_update_own" ON public.sessions;
CREATE POLICY "sessions_update_own" ON public.sessions FOR UPDATE USING (auth.uid() = coach_id);
DROP POLICY IF EXISTS "sessions_delete_own" ON public.sessions;
CREATE POLICY "sessions_delete_own" ON public.sessions FOR DELETE USING (auth.uid() = coach_id);

-- coach_settings
DROP POLICY IF EXISTS "coach_settings_all_own" ON public.coach_settings;
CREATE POLICY "coach_settings_all_own" ON public.coach_settings
  FOR ALL USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

-- ─── 7. INDEXES ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_athletes_coach_id ON public.athletes(coach_id);
CREATE INDEX IF NOT EXISTS idx_athletes_team_id  ON public.athletes(team_id);
CREATE INDEX IF NOT EXISTS idx_athletes_nk       ON public.athletes(coach_id, nk);
CREATE INDEX IF NOT EXISTS idx_sessions_athlete  ON public.sessions(athlete_id);
CREATE INDEX IF NOT EXISTS idx_sessions_coach    ON public.sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date     ON public.sessions(athlete_id, test_date DESC);
CREATE INDEX IF NOT EXISTS idx_teams_coach       ON public.teams(coach_id);
