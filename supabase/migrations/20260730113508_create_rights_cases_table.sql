/*
# Create rights_cases table (rights portal — case files)

1. New Tables
- `rights_cases`
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to the authenticated user, references auth.users)
- `title` (text, short label for the case)
- `case_type` (text, category of the situation e.g. bituach-leumi, tax, general)
- `description` (text, the full details the person wrote about their situation)
- `accusation` (text, what the person is being accused of / the problem they face, optional)
- `ai_analysis` (text, plain-language AI explanation of the situation and strategy)
- `rights_found` (jsonb, array of rights/benefits the person may be entitled to)
- `generated_letters` (jsonb, array of drafted official letters to authorities)
- `status` (text, default 'draft')
- `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `rights_cases`.
- Owner-scoped CRUD: each authenticated user can only access rows they own.
- 4 separate policies (select/insert/update/delete) scoped TO authenticated using auth.uid() = user_id.

3. Notes
1. The `user_id` column defaults to `auth.uid()` so inserts from the frontend that omit the owner still satisfy the INSERT policy.
2. `rights_found` and `generated_letters` are stored as JSON arrays so the structured AI output can be persisted and re-rendered later.
3. An index on (user_id, created_at) speeds up listing a person's saved cases newest-first.
*/

CREATE TABLE IF NOT EXISTS rights_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'תיק זכויות',
  case_type text NOT NULL DEFAULT 'general',
  description text NOT NULL DEFAULT '',
  accusation text NOT NULL DEFAULT '',
  ai_analysis text NOT NULL DEFAULT '',
  rights_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_letters jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rights_cases ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_rights_cases_user_created ON rights_cases (user_id, created_at DESC);

DROP POLICY IF EXISTS "select_own_rights_cases" ON rights_cases;
CREATE POLICY "select_own_rights_cases" ON rights_cases FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_rights_cases" ON rights_cases;
CREATE POLICY "insert_own_rights_cases" ON rights_cases FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_rights_cases" ON rights_cases;
CREATE POLICY "update_own_rights_cases" ON rights_cases FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_rights_cases" ON rights_cases;
CREATE POLICY "delete_own_rights_cases" ON rights_cases FOR DELETE
  TO authenticated USING (auth.uid() = user_id);