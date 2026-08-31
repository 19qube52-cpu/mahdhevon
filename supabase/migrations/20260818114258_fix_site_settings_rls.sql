/*
# Fix site_settings RLS: add INSERT and UPDATE policies for authenticated admins

1. Security Changes
- site_settings currently only has a SELECT policy (is_secret = false) for anon+authenticated
- The admin panel needs to INSERT/UPDATE settings (site_name, site_domain, telegram_bot_token, etc.)
- Added INSERT and UPDATE policies scoped to authenticated admin users only
- Secret values can only be read by admins (new SELECT policy for authenticated that includes secrets)
*/

DROP POLICY IF EXISTS "settings_select" ON site_settings;
CREATE POLICY "settings_select_public"
ON site_settings FOR SELECT
TO anon, authenticated
USING (is_secret = false);

DROP POLICY IF EXISTS "settings_select_admin" ON site_settings;
CREATE POLICY "settings_select_admin"
ON site_settings FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY IF EXISTS "settings_insert_admin" ON site_settings;
CREATE POLICY "settings_insert_admin"
ON site_settings FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY IF EXISTS "settings_update_admin" ON site_settings;
CREATE POLICY "settings_update_admin"
ON site_settings FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
