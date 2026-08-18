/*
# Create analytics, contact submissions, and custom calculators tables

## Overview
Adds three new tables to support a full admin management system:
1. `page_analytics` — tracks page views and calculator usage events from all visitors
2. `contact_submissions` — stores contact form submissions from site visitors
3. `custom_calculators` — stores calculator definitions created by admins through the admin panel

## New Tables

### page_analytics
- `id` (uuid, primary key)
- `event_type` (text: 'page_view' or 'calculator_use')
- `page_path` (text, the URL path visited)
- `calculator_slug` (text, nullable — set when event_type = 'calculator_use')
- `user_id` (uuid, nullable — set if user is logged in)
- `session_id` (text, anonymous session identifier for non-logged-in users)
- `country_code` (text, nullable)
- `referrer` (text, nullable)
- `created_at` (timestamptz, defaults to now())

### contact_submissions
- `id` (uuid, primary key)
- `name` (text, not null)
- `email` (text, not null)
- `subject` (text, not null)
- `message` (text, not null)
- `status` (text: 'new', 'read', 'replied', 'archived' — defaults to 'new')
- `user_id` (uuid, nullable — set if logged in)
- `created_at` (timestamptz, defaults to now())
- `updated_at` (timestamptz, defaults to now())

### custom_calculators
- `id` (uuid, primary key)
- `slug` (text, unique, not null)
- `title` (text, not null)
- `short_title` (text, not null)
- `category_slug` (text, not null)
- `description` (text, not null)
- `seo_title` (text, nullable)
- `seo_description` (text, nullable)
- `keywords` (jsonb, defaults to '[]')
- `inputs` (jsonb, not null — array of CalculatorInput objects)
- `formula_code` (text, not null — JavaScript function body)
- `result_labels` (jsonb, not null — labels for result fields)
- `quick_answer` (jsonb, nullable)
- `formula_explanation` (text, nullable)
- `example_text` (text, nullable)
- `faqs` (jsonb, defaults to '[]')
- `related_slugs` (jsonb, defaults to '[]')
- `disclaimer` (text, nullable)
- `source_note` (text, nullable)
- `seo_content` (text, nullable)
- `is_active` (boolean, defaults to true)
- `created_by` (uuid, nullable — admin who created it)
- `created_at` (timestamptz, defaults to now())
- `updated_at` (timestamptz, defaults to now())

## Security

### page_analytics
- RLS enabled
- INSERT: allowed for anon + authenticated (anyone can track events)
- SELECT: admin only (via user_roles check)
- No UPDATE or DELETE policies (immutable event log)

### contact_submissions
- RLS enabled
- INSERT: allowed for anon + authenticated (anyone can submit)
- SELECT/UPDATE: admin only (via user_roles check)
- No DELETE policy (submissions are archived, not deleted)

### custom_calculators
- RLS enabled
- SELECT: allowed for anon + authenticated (public can view active calculators)
- INSERT/UPDATE: admin only (via user_roles check)
- No DELETE policy (calculators are deactivated via is_active flag)

## Indexes
- page_analytics: on created_at, event_type, calculator_slug
- contact_submissions: on created_at, status
- custom_calculators: on slug (unique), category_slug, is_active

## Important Notes
1. Admin access is enforced via EXISTS subquery on user_roles table checking role = 'admin'
2. The page_analytics table is append-only — no updates or deletes
3. Custom calculators store formula_code as text — executed safely in the browser via Function constructor
4. Contact submissions use status workflow: new → read → replied → archived
*/

-- ─── page_analytics ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('page_view', 'calculator_use')),
  page_path text NOT NULL,
  calculator_slug text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  country_code text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE page_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_analytics" ON page_analytics;
CREATE POLICY "anon_insert_analytics" ON page_analytics FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_analytics" ON page_analytics;
CREATE POLICY "admin_read_analytics" ON page_analytics FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON page_analytics (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON page_analytics (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_calc_slug ON page_analytics (calculator_slug) WHERE calculator_slug IS NOT NULL;

-- ─── contact_submissions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_contacts" ON contact_submissions;
CREATE POLICY "anon_insert_contacts" ON contact_submissions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_contacts" ON contact_submissions;
CREATE POLICY "admin_read_contacts" ON contact_submissions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_contacts" ON contact_submissions;
CREATE POLICY "admin_update_contacts" ON contact_submissions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contact_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contact_submissions (status);

-- ─── custom_calculators ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_calculators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  short_title text NOT NULL,
  category_slug text NOT NULL,
  description text NOT NULL,
  seo_title text,
  seo_description text,
  keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  inputs jsonb NOT NULL,
  formula_code text NOT NULL,
  result_labels jsonb NOT NULL,
  quick_answer jsonb,
  formula_explanation text,
  example_text text,
  faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  related_slugs jsonb NOT NULL DEFAULT '[]'::jsonb,
  disclaimer text,
  source_note text,
  seo_content text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE custom_calculators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_calculators" ON custom_calculators;
CREATE POLICY "public_read_active_calculators" ON custom_calculators FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_insert_calculators" ON custom_calculators;
CREATE POLICY "admin_insert_calculators" ON custom_calculators FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_calculators" ON custom_calculators;
CREATE POLICY "admin_update_calculators" ON custom_calculators FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_custom_calc_slug ON custom_calculators (slug);
CREATE INDEX IF NOT EXISTS idx_custom_calc_category ON custom_calculators (category_slug);
CREATE INDEX IF NOT EXISTS idx_custom_calc_active ON custom_calculators (is_active) WHERE is_active = true;

-- ─── updated_at trigger for contact_submissions ──────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON contact_submissions;
CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_custom_calc_updated_at ON custom_calculators;
CREATE TRIGGER trg_custom_calc_updated_at
  BEFORE UPDATE ON custom_calculators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
