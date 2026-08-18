-- 1. Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'user')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own role
CREATE POLICY "select_own_role" ON user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies for authenticated users
-- (only service role can manage roles)

-- 2. Seed existing admin user
INSERT INTO user_roles (user_id, role)
VALUES ('782c1356-2cd1-4416-b9ee-f7c4f114a818', 'admin')
ON CONFLICT (user_id) DO NOTHING;

-- 3. Lock down admin tables: remove anon/authenticated grants and add admin-only policies

-- calculator_queue: only admins (via service role in edge functions)
REVOKE ALL ON calculator_queue FROM anon, authenticated;
GRANT SELECT ON calculator_queue TO authenticated;
-- Keep existing SELECT policy but restrict: only admin users can see it
DROP POLICY IF EXISTS "queue_select" ON calculator_queue;
CREATE POLICY "queue_select_admin" ON calculator_queue
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- daily_featured: public read stays (homepage needs it), but writes are admin-only
-- Already has SELECT policy for public. Keep it.
-- Revoke write grants from anon/authenticated
REVOKE INSERT, UPDATE, DELETE ON daily_featured FROM anon, authenticated;

-- ai_content: admin-only read
REVOKE ALL ON ai_content FROM anon, authenticated;
GRANT SELECT ON ai_content TO authenticated;
DROP POLICY IF EXISTS "ai_content_select" ON ai_content;
CREATE POLICY "ai_content_select_admin" ON ai_content
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ai_providers: admin-only read (table has api_key column!)
REVOKE ALL ON ai_providers FROM anon, authenticated;
GRANT SELECT ON ai_providers TO authenticated;
DROP POLICY IF EXISTS "providers_select" ON ai_providers;
CREATE POLICY "providers_select_admin" ON ai_providers
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- site_settings: only non-secret settings are public-read
-- Revoke write from anon/authenticated
REVOKE INSERT, UPDATE, DELETE ON site_settings FROM anon, authenticated;
-- Keep SELECT policy (is_secret = false filter) as-is

-- ai_providers_public view: restrict to admin only
REVOKE ALL ON ai_providers_public FROM anon, authenticated;
GRANT SELECT ON ai_providers_public TO authenticated;
-- The view inherits RLS from base table (security_invoker=true), so the
-- admin-only SELECT policy on ai_providers already controls access.
