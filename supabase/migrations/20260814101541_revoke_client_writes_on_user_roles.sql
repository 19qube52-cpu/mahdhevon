/*
  # Lock down writes to the role table

  1. Security
    - Revoke INSERT, UPDATE, DELETE on public.user_roles from anon and authenticated.
      Every admin check in the app resolves against this table, so clients must never
      be able to write it; roles are managed by the service role only.
    - SELECT is kept so the existing "select_own_role" policy keeps working.
*/

REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;
REVOKE SELECT ON public.user_roles FROM anon;
