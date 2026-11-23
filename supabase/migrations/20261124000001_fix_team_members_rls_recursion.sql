-- Migration: 20261124000001_fix_team_members_rls_recursion.sql
-- Description: Fix infinite recursion detected in policy for relation "team_members"
-- Uses a SECURITY DEFINER helper to check team membership without recursive RLS evaluation.

-- 1. Helper function to check team membership safely
CREATE OR REPLACE FUNCTION public.is_team_member(_team_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id AND user_id = _user_id
  );
$$;

-- 2. Drop and recreate teams_read_own policy
DROP POLICY IF EXISTS "teams_read_own" ON public.teams;
CREATE POLICY "teams_read_own" ON public.teams
  FOR SELECT TO authenticated
  USING (
    captain_id = (SELECT auth.uid()) OR
    public.is_team_member(id, (SELECT auth.uid())) OR
    public.has_role('panitia', competition_id) OR
    public.has_role('super_admin')
  );

-- 3. Drop and recreate team_members_read_own policy
DROP POLICY IF EXISTS "team_members_read_own" ON public.team_members;
CREATE POLICY "team_members_read_own" ON public.team_members
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR
    public.is_team_member(team_id, (SELECT auth.uid())) OR
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND (
        t.captain_id = (SELECT auth.uid()) OR
        public.has_role('panitia', t.competition_id) OR
        public.has_role('super_admin')
      )
    )
  );

-- 4. Fix registrations_read_own policy to use the helper function as well
DROP POLICY IF EXISTS "registrations_read_own" ON public.registrations;
CREATE POLICY "registrations_read_own" ON public.registrations
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR
    (team_id IS NOT NULL AND public.is_team_member(team_id, (SELECT auth.uid()))) OR
    public.has_role('panitia', competition_id) OR
    public.has_role('super_admin')
  );
