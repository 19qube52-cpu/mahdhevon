/*
  # Remove signed-out access to personal data tables

  1. Security
    - Revoke all privileges on favorites, saved_items and rights_cases from anon.
      Every policy on these tables is already scoped to authenticated owners, so
      the anon role has no legitimate use for them; removing the privilege closes
      the gap at the permission layer as well as the policy layer.
    - authenticated privileges are unchanged, so the app keeps working.
*/

REVOKE ALL ON public.favorites FROM anon;
REVOKE ALL ON public.saved_items FROM anon;
REVOKE ALL ON public.rights_cases FROM anon;
