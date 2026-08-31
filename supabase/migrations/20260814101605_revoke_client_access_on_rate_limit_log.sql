/*
  # Make the rate limit ledger service-role only

  1. Security
    - Revoke all privileges on public.rate_limit_log from anon and authenticated.
      The table is written and read exclusively by edge functions using the service
      role key; clients must not be able to read, forge or clear rate limit rows.
    - RLS stays enabled with no policies, so the table is denied at both layers.
*/

REVOKE ALL ON public.rate_limit_log FROM anon;
REVOKE ALL ON public.rate_limit_log FROM authenticated;
