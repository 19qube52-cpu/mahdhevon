/*
# Fix ai_providers_public view: replace SECURITY DEFINER with SECURITY INVOKER

## Problem
The view `public.ai_providers_public` was created with the implicit SECURITY DEFINER
property, meaning it ran with the view owner's (postgres superuser) privileges and
bypassed Row Level Security on the underlying `ai_providers` table.

## Fix
Drop and recreate the view with `security_invoker = true` so that:
- The view executes with the privileges of the CALLER (the querying role), not the owner.
- Row Level Security on `ai_providers` is fully enforced for every query through the view.
- The `anon` and `authenticated` roles can only see columns exposed by the view (no raw api_key).

## Security impact
- Eliminates the SECURITY DEFINER escalation path.
- RLS SELECT policy on `ai_providers` ("providers_select") now applies correctly for all callers.
*/

DROP VIEW IF EXISTS public.ai_providers_public;

CREATE VIEW public.ai_providers_public
  WITH (security_invoker = true)
AS
SELECT
  id,
  provider,
  display_name,
  logo_emoji,
  base_url,
  default_model,
  priority,
  is_active,
  error_count,
  last_error,
  last_used_at,
  total_calls,
  created_at,
  updated_at,
  CASE
    WHEN api_key IS NOT NULL AND api_key != ''
    THEN LEFT(api_key, 4) || repeat('*', 8)
    ELSE NULL
  END AS api_key_masked,
  (api_key IS NOT NULL AND api_key != '') AS has_key
FROM public.ai_providers
ORDER BY priority ASC, created_at ASC;
