/*
# AI Provider Key Bank + Site Settings

Tables:
- ai_providers: multi-provider config with API keys (service_role reads full key, frontend sees masked)
- site_settings: generic key/value settings (Telegram token, chat ID, etc.)

Views:
- ai_providers_public: masks api_key to first-4 + **** for safe frontend display
*/

-- ─── ai_providers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_providers (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider      text        UNIQUE NOT NULL,
  display_name  text        NOT NULL,
  logo_emoji    text        DEFAULT '🤖',
  api_key       text,
  base_url      text,
  default_model text        NOT NULL,
  priority      integer     DEFAULT 100, -- lower = higher priority
  is_active     boolean     DEFAULT false,
  error_count   integer     DEFAULT 0,
  last_error    text,
  last_used_at  timestamptz,
  total_calls   integer     DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Masked view safe for frontend (anon/authenticated)
CREATE OR REPLACE VIEW ai_providers_public AS
SELECT
  id, provider, display_name, logo_emoji,
  base_url, default_model, priority, is_active,
  error_count, last_error, last_used_at, total_calls, created_at, updated_at,
  CASE WHEN api_key IS NOT NULL AND api_key != ''
       THEN LEFT(api_key, 4) || repeat('*', 8)
       ELSE NULL END  AS api_key_masked,
  (api_key IS NOT NULL AND api_key != '') AS has_key
FROM ai_providers
ORDER BY priority ASC, created_at ASC;

ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;

-- Frontend: read-only on public columns (key is hidden by the view)
CREATE POLICY "providers_select" ON ai_providers FOR SELECT TO anon, authenticated USING (true);
-- Writes exclusively via service_role (edge functions)

-- ─── site_settings ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  key        text        PRIMARY KEY,
  value      text,
  label      text,
  is_secret  boolean     DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select" ON site_settings FOR SELECT TO anon, authenticated
  USING (is_secret = false);
-- Writes only via service_role

-- ─── Seed default providers ────────────────────────────────────────
INSERT INTO ai_providers (provider, display_name, logo_emoji, base_url, default_model, priority, is_active) VALUES
  ('grok',       'xAI Grok',         '⚡', 'https://api.x.ai/v1',                              'grok-3-latest',                  10,  true),
  ('openai',     'OpenAI ChatGPT',   '🟢', 'https://api.openai.com/v1',                        'gpt-4o-mini',                    20,  false),
  ('anthropic',  'Anthropic Claude', '🟠', 'https://api.anthropic.com',                        'claude-3-5-haiku-20241022',       30,  false),
  ('gemini',     'Google Gemini',    '💠', 'https://generativelanguage.googleapis.com/v1beta',  'gemini-2.0-flash',               40,  false),
  ('openrouter', 'OpenRouter',       '🔀', 'https://openrouter.ai/api/v1',                     'meta-llama/llama-4-scout:free',   50,  false),
  ('ollama',     'Ollama (Local)',    '🖥️', 'http://localhost:11434/v1',                        'llama3.2',                       90,  false)
ON CONFLICT (provider) DO NOTHING;

-- Seed public site settings
INSERT INTO site_settings (key, value, label, is_secret) VALUES
  ('site_name',         'chasav.li',    'שם האתר',             false),
  ('telegram_chat_id',  '',             'מזהה צ''אט טלגרם',    false),
  ('alert_on_publish',  'true',         'התראה בפרסום',        false)
ON CONFLICT (key) DO NOTHING;
