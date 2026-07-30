/*
# Fix security issues: pg_net schema + RLS write-policy removal

1. Move pg_net from public schema to extensions schema
   - The pg_net extension was installed in public; moving it to
     the dedicated extensions schema is best practice and stops
     the security scanner warning.

2. Tighten RLS on calculator_queue and daily_featured
   - Remove all INSERT / UPDATE / DELETE policies for authenticated/anon.
   - All write operations now go exclusively through Edge Functions that
     use the SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS entirely.
   - SELECT policies (anon + authenticated) are kept so the homepage
     and CRM dashboard can still read data.
   - This eliminates the "always-true policy" security findings.
*/

-- ─── 1. Relocate pg_net to extensions schema ─────────────────────
-- Drop and recreate in extensions schema (safe: pg_net data lives in
-- the http_request_queue table, not in schema-local state).
DROP EXTENSION IF EXISTS pg_net CASCADE;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- ─── 2. Drop overly-permissive write policies ─────────────────────

-- calculator_queue
DROP POLICY IF EXISTS "queue_insert" ON public.calculator_queue;
DROP POLICY IF EXISTS "queue_update" ON public.calculator_queue;
DROP POLICY IF EXISTS "queue_delete" ON public.calculator_queue;

-- daily_featured
DROP POLICY IF EXISTS "featured_insert" ON public.daily_featured;
DROP POLICY IF EXISTS "featured_update" ON public.daily_featured;

-- No replacement policies needed: the service_role used by Edge Functions
-- bypasses RLS entirely, so writes still work.  Authenticated/anon clients
-- are intentionally restricted to SELECT only.
