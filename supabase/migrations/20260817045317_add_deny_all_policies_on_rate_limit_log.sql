-- rate_limit_log is written only by edge functions using the service role,
-- which bypasses RLS. No client (anon or authenticated) should ever read or
-- write it. All table GRANTs were already revoked in a prior migration; these
-- policies make the deny-by-default explicit so the RLS lint is satisfied and
-- the table's access model is self-documenting.

CREATE POLICY "deny_all_rate_limit_log"
  ON public.rate_limit_log
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
