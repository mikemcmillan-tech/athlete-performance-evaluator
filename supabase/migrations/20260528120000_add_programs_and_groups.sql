-- APE programs and training groups foundation.
-- The app stores these locally first; these tables prepare safe coach-scoped cloud sync.

ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS season_phase text NOT NULL DEFAULT 'offSeason';

CREATE TABLE IF NOT EXISTS public.program_groups (
  id uuid PRIMARY KEY,
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  athlete_ids uuid[] NOT NULL DEFAULT '{}',
  season_phase text NOT NULL DEFAULT 'off',
  shared_program_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.programs (
  id uuid PRIMARY KEY,
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id uuid REFERENCES public.athletes(id) ON DELETE SET NULL,
  group_id uuid REFERENCES public.program_groups(id) ON DELETE SET NULL,
  season_phase text NOT NULL DEFAULT 'off',
  bucket_primary text NOT NULL DEFAULT '',
  bucket_secondary text NOT NULL DEFAULT '',
  weeks jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_edited_by uuid,
  last_edited_at timestamptz NOT NULL DEFAULT now(),
  created_from_default boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.program_groups
  ADD CONSTRAINT program_groups_shared_program_fk
  FOREIGN KEY (shared_program_id)
  REFERENCES public.programs(id)
  ON DELETE SET NULL;

ALTER TABLE public.program_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "program_groups_select_own" ON public.program_groups;
CREATE POLICY "program_groups_select_own" ON public.program_groups FOR SELECT USING (auth.uid() = coach_id);
DROP POLICY IF EXISTS "program_groups_insert_own" ON public.program_groups;
CREATE POLICY "program_groups_insert_own" ON public.program_groups FOR INSERT WITH CHECK (auth.uid() = coach_id);
DROP POLICY IF EXISTS "program_groups_update_own" ON public.program_groups;
CREATE POLICY "program_groups_update_own" ON public.program_groups FOR UPDATE USING (auth.uid() = coach_id);
DROP POLICY IF EXISTS "program_groups_delete_own" ON public.program_groups;
CREATE POLICY "program_groups_delete_own" ON public.program_groups FOR DELETE USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "programs_select_own" ON public.programs;
CREATE POLICY "programs_select_own" ON public.programs FOR SELECT USING (auth.uid() = coach_id);
DROP POLICY IF EXISTS "programs_insert_own" ON public.programs;
CREATE POLICY "programs_insert_own" ON public.programs FOR INSERT WITH CHECK (auth.uid() = coach_id);
DROP POLICY IF EXISTS "programs_update_own" ON public.programs;
CREATE POLICY "programs_update_own" ON public.programs FOR UPDATE USING (auth.uid() = coach_id);
DROP POLICY IF EXISTS "programs_delete_own" ON public.programs;
CREATE POLICY "programs_delete_own" ON public.programs FOR DELETE USING (auth.uid() = coach_id);

CREATE INDEX IF NOT EXISTS idx_program_groups_coach ON public.program_groups(coach_id);
CREATE INDEX IF NOT EXISTS idx_programs_coach ON public.programs(coach_id);
CREATE INDEX IF NOT EXISTS idx_programs_athlete ON public.programs(athlete_id);
CREATE INDEX IF NOT EXISTS idx_programs_group ON public.programs(group_id);
