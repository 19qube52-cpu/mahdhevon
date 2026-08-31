/*
# Create rate_limit_log table for IP-based rate limiting

1. New Tables
- `rate_limit_log`
  - `id` (uuid, primary key)
  - `ip_hash` (text, not null) — SHA-256 hash of client IP (never store raw IP)
  - `function_name` (text, not null) — which edge function was called
  - `created_at` (timestamptz, default now())

2. Indexes
- Index on (ip_hash, function_name, created_at) for fast rate-limit queries

3. Security
- RLS enabled, no policies for anon/authenticated (only service role can insert/query)
- This table is only accessed from edge functions using the service role key
*/

CREATE TABLE IF NOT EXISTS rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  function_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rate_limit_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup
  ON rate_limit_log (ip_hash, function_name, created_at DESC);
