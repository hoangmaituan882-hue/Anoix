-- ============================================================
-- Forward migration: user management (role assignment)
--   Admins may INSERT/UPDATE/DELETE user_roles rows (promote /
--   demote). Account lifecycle (create/delete/disable) lives in
--   CloudBase Auth and is driven via the TC API — not here.
-- ============================================================

-- Authenticated callers may write user_roles (RLS gates WHO may).
GRANT INSERT, UPDATE, DELETE ON user_roles TO authenticated;

-- Constrain the role vocabulary (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'user_roles'::regclass AND conname = 'user_roles_role_check'
  ) THEN
    ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
      CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- Admin check helper. SECURITY DEFINER makes the body run as the table
-- owner (which bypasses RLS), so the self-referential look-up cannot
-- recurse through the policies below. `auth.uid()` still resolves the
-- CALLER because it reads a request-level GUC.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE uid = auth.uid() AND role = 'admin'
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- Admin-only write policy (defense-in-depth; the API layer also gates).
DROP POLICY IF EXISTS user_roles_admin_write ON user_roles;
CREATE POLICY user_roles_admin_write ON user_roles FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
