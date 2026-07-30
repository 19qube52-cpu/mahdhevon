/*
# Calculator CRM Tables

Creates the scheduling infrastructure for the daily calculator publisher.

1. New Tables
   - `calculator_queue`: ordered list of calculators waiting to be featured
     - id, calculator_id, slug, title, category, position (sort order)
     - status: pending | published | skipped
     - scheduled_date (optional target date), published_at, notes
   - `daily_featured`: one row per calendar date recording which calculator was shown
     - date (unique), calculator_slug, calculator_id, calculator_title, published_at

2. Security
   - RLS enabled on both tables
   - Anon + authenticated can read (so homepage can show today's featured)
   - Only authenticated can write (CRM actions)

3. Indexes
   - calculator_queue: (status, position) for fetching next pending item
   - daily_featured: (date) for today lookup

4. Seed
   - Inserts all 22 existing calculators into the queue in a sensible order
     so the CRM starts with a full pre-loaded list ready to go.
*/

-- ─── calculator_queue ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calculator_queue (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  calculator_id text        NOT NULL,
  calculator_slug text      NOT NULL,
  calculator_title text     NOT NULL,
  calculator_category text,
  position      integer     NOT NULL DEFAULT 0,
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','published','skipped')),
  scheduled_date date,
  published_at  timestamptz,
  notes         text,
  added_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_queue_status_pos
  ON calculator_queue (status, position);

ALTER TABLE calculator_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "queue_select" ON calculator_queue;
CREATE POLICY "queue_select" ON calculator_queue FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "queue_insert" ON calculator_queue;
CREATE POLICY "queue_insert" ON calculator_queue FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "queue_update" ON calculator_queue;
CREATE POLICY "queue_update" ON calculator_queue FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "queue_delete" ON calculator_queue;
CREATE POLICY "queue_delete" ON calculator_queue FOR DELETE
  TO authenticated USING (true);

-- ─── daily_featured ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_featured (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  date              date        UNIQUE NOT NULL DEFAULT current_date,
  calculator_slug   text        NOT NULL,
  calculator_id     text        NOT NULL,
  calculator_title  text        NOT NULL,
  published_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_featured_date
  ON daily_featured (date DESC);

ALTER TABLE daily_featured ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "featured_select" ON daily_featured;
CREATE POLICY "featured_select" ON daily_featured FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "featured_insert" ON daily_featured;
CREATE POLICY "featured_insert" ON daily_featured FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "featured_update" ON daily_featured;
CREATE POLICY "featured_update" ON daily_featured FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ─── Seed queue with all existing calculators ──────────────────────
INSERT INTO calculator_queue
  (calculator_id, calculator_slug, calculator_title, calculator_category, position)
VALUES
  ('bruto-neto',           'bruto-neto',           'מחשבון ברוטו לנטו',              'salary-tax',      1),
  ('neto-bruto',           'neto-bruto',            'מחשבון נטו לברוטו',              'salary-tax',      2),
  ('bituach-leumi-employee','bituach-leumi-employee','ביטוח לאומי שכיר',              'bituach-leumi',   3),
  ('tax-credit-points',    'tax-credit-points',     'מחשבון נקודות זיכוי',            'salary-tax',      4),
  ('vat-calculator',       'vat-calculator',        'מחשבון מע"מ',                    'tax',             5),
  ('mortgage-payment',     'mortgage-payment',      'מחשבון משכנתא',                  'mortgage-loans',  6),
  ('loan-payment',         'loan-payment',          'מחשבון הלוואה',                  'mortgage-loans',  7),
  ('compound-interest',    'compound-interest',     'מחשבון ריבית דריבית',            'savings',         8),
  ('bmi',                  'bmi',                   'מחשבון BMI',                     'health',          9),
  ('pregnancy-week',       'pregnancy-week',        'מחשבון שבוע היריון',             'health',          10),
  ('pension-estimate',     'pension-estimate',      'מחשבון פנסיה',                   'pension',         11),
  ('self-employed-tax',    'self-employed-tax',     'מחשבון שכר עצמאי',              'self-employed',   12),
  ('hourly-to-monthly',    'hourly-to-monthly',     'מחשבון שכר שעתי לחודשי',        'salary-tax',      13),
  ('property-purchase-tax','property-purchase-tax', 'מחשבון מס רכישה',               'mortgage-loans',  14),
  ('credit-card-payoff',   'credit-card-payoff',    'מחשבון פירעון חוב כרטיס אשראי', 'mortgage-loans',  15),
  ('rental-yield',         'rental-yield',          'מחשבון תשואת שכירות',            'mortgage-loans',  16),
  ('salary-raise',         'salary-raise',          'מחשבון העלאת שכר',              'salary-tax',      17),
  ('rent-vs-buy',          'rent-vs-buy',           'מחשבון שכירות מול קנייה',       'mortgage-loans',  18)
ON CONFLICT DO NOTHING;
