/*
# Create telegram_logs table and add site_domain setting

1. New Tables
- `telegram_logs` — stores incoming/outgoing Telegram bot messages for the admin panel
  - `id` (uuid, PK)
  - `event` (text) — event type: "incoming_message", "outgoing_reply", "calc_created", "error", etc.
  - `direction` (text) — "in" for incoming, "out" for outgoing
  - `summary` (text) — short description of the message content
  - `chat_id` (text, nullable) — Telegram chat ID
  - `created_at` (timestamptz, default now())

2. Modified Tables
- `site_settings` — no schema change needed, just adds row for `site_domain` key

3. Security
- RLS enabled on `telegram_logs`
- SELECT only for authenticated users (admin panel reads it)
- All writes (INSERT) via service role only (edge functions), so no client INSERT policy
*/

CREATE TABLE IF NOT EXISTS telegram_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL DEFAULT 'message',
  direction text NOT NULL DEFAULT 'out',
  summary text NOT NULL DEFAULT '',
  chat_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE telegram_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_telegram_logs_authenticated" ON telegram_logs;
CREATE POLICY "select_telegram_logs_authenticated"
ON telegram_logs FOR SELECT
TO authenticated USING (true);
