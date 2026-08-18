/*
# Setup pg_cron for daily calculator publishing

Schedules the publish-daily-calculator edge function to run every day
at 00:01 UTC (03:01 Israel time in winter, 02:01 in summer).

The cron job calls the deployed edge function via HTTP using pg_net.
This ensures one new calculator is automatically featured every day.
*/

-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove old cron job if it exists
SELECT cron.unschedule('publish-daily-calculator')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'publish-daily-calculator'
);

-- Schedule: every day at 00:01 UTC
SELECT cron.schedule(
  'publish-daily-calculator',
  '1 0 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/publish-daily-calculator',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
