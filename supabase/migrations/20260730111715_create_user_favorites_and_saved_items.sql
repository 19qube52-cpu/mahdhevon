/*
# User accounts: favorites and saved items

Adds personalization tables so signed-in users can bookmark calculators and
save calculation results and AI analyses to revisit later.

1. New Tables
   - `favorites` — a bookmarked calculator per user.
     - `id` (uuid, primary key)
     - `user_id` (uuid, not null, defaults to the authenticated user)
     - `calculator_slug` (text, not null)
     - `calculator_title` (text, not null)
     - `category_slug` (text, nullable)
     - `created_at` (timestamptz)
     - Unique per (user_id, calculator_slug) so a calculator can only be favorited once.
   - `saved_items` — a saved calculation result snapshot or AI analysis per user.
     - `id` (uuid, primary key)
     - `user_id` (uuid, not null, defaults to the authenticated user)
     - `calculator_slug` (text, not null)
     - `calculator_title` (text, not null)
     - `kind` (text, 'result' or 'ai')
     - `inputs` (jsonb, nullable) — the input values used
     - `summary` (text, nullable) — short human-readable result summary
     - `ai_text` (text, nullable) — the AI analysis text
     - `provider` (text, nullable) — which AI provider produced the analysis
     - `created_at` (timestamptz)

2. Security
   - Enable RLS on both tables.
   - Owner-scoped CRUD: each authenticated user can only access rows they own.
   - Owner columns default to auth.uid() so inserts that omit user_id still pass the INSERT policy.

3. Notes
   - Indexes on user_id for fast per-user listing.
*/

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  calculator_slug text NOT NULL,
  calculator_title text NOT NULL,
  category_slug text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, calculator_slug)
);

CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites (user_id);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_favorites" ON favorites;
CREATE POLICY "select_own_favorites" ON favorites FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_favorites" ON favorites;
CREATE POLICY "insert_own_favorites" ON favorites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_favorites" ON favorites;
CREATE POLICY "update_own_favorites" ON favorites FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_favorites" ON favorites;
CREATE POLICY "delete_own_favorites" ON favorites FOR DELETE
  TO authenticated USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS saved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  calculator_slug text NOT NULL,
  calculator_title text NOT NULL,
  kind text NOT NULL DEFAULT 'result' CHECK (kind = ANY (ARRAY['result'::text, 'ai'::text])),
  inputs jsonb,
  summary text,
  ai_text text,
  provider text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS saved_items_user_id_idx ON saved_items (user_id);

ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_saved_items" ON saved_items;
CREATE POLICY "select_own_saved_items" ON saved_items FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_saved_items" ON saved_items;
CREATE POLICY "insert_own_saved_items" ON saved_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_saved_items" ON saved_items;
CREATE POLICY "update_own_saved_items" ON saved_items FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_saved_items" ON saved_items;
CREATE POLICY "delete_own_saved_items" ON saved_items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
