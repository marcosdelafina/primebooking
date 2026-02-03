-- Migration: Setup Google Calendar Sync Trigger
-- Date: 2026-02-03
-- Description: Creates the trigger and function to sync agendamentos with Google Calendar in production.

BEGIN;

-- 1. Create the function that calls the Edge Function
CREATE OR REPLACE FUNCTION public.on_agendamento_sync_google()
RETURNS TRIGGER AS $$
DECLARE
    payload JSONB;
    target_record JSONB;
BEGIN
    -- Determine which record to send
    IF (TG_OP = 'DELETE') THEN
        target_record := row_to_json(OLD)::jsonb;
    ELSE
        target_record := row_to_json(NEW)::jsonb;
    END IF;

    -- Build the payload
    payload := jsonb_build_object(
        'type', TG_OP,
        'table', 'agendamentos',
        'record', target_record,
        'old_record', CASE WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END
    );

    -- Call the Edge Function
    -- Note: We use the production project URL here
    PERFORM
        net.http_post(
            url := 'https://qckzsvnhtenmcgqmctfn.supabase.co/functions/v1/google-calendar-sync',
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
            ),
            body := payload
        );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS tr_sync_agendamento_to_google ON public.agendamentos;
CREATE TRIGGER tr_sync_agendamento_to_google
    AFTER INSERT OR UPDATE OR DELETE ON public.agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION public.on_agendamento_sync_google();

COMMIT;
