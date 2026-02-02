-- SQL to set up the synchronization trigger
-- Execute this in the Supabase SQL Editor

-- 1. Ensure the agendamentos table has the google_event_id column (already in schema)
-- ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- 2. Create the Database Webhook (Trigger)
-- Note: In the Supabase Dashboard, go to Database -> Webhooks -> Create New Webhook.
-- Table: agendamentos
-- Events: Insert, Update, Delete
-- Type: Edge Function
-- Function: google-calendar-sync
-- HTTP Header: Content-Type: application/json
-- HTTP Header: Authorization: Bearer [YOUR_SERVICE_ROLE_KEY]

-- Alternatively, via SQL (requires pg_net):
-- CREATE TRIGGER sync_agendamento_to_google
-- AFTER INSERT OR UPDATE OR DELETE ON public.agendamentos
-- FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(
--   'post',
--   'https://[YOUR-PROJECT-REF].supabase.co/functions/v1/google-calendar-sync',
--   '{"Content-Type": "application/json", "Authorization": "Bearer [SERVICE-ROLE-KEY]"}'
-- );
