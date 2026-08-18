/*
# AI Content Storage Table

Stores outputs from the ai-crm-assistant edge function so results
are cached and browsable in the CRM without re-calling the AI.

Content types: description | article | notes | title_variants |
               faq | social_post | audience | tags |
               seasonal | scheduling | queue_plan | summary
*/

CREATE TABLE IF NOT EXISTS ai_content (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  calculator_id  text        NOT NULL,
  content_type   text        NOT NULL,
  content        text        NOT NULL,
  model          text        DEFAULT 'grok-3',
  prompt_tokens  integer,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_content_calc_type
  ON ai_content (calculator_id, content_type, created_at DESC);

ALTER TABLE ai_content ENABLE ROW LEVEL SECURITY;

-- Read: anyone (so CRM can fetch results)
CREATE POLICY "ai_content_select" ON ai_content FOR SELECT
  TO anon, authenticated USING (true);

-- Writes only via service_role (edge function)
-- No insert/update/delete policies for anon/authenticated.
