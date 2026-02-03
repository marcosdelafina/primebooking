-- Migration: Fix Trigger Recursion and Project ID
-- Date: 2026-02-04
-- Description: Updates triggers to prevent recursive syncs when google_event_id is updated, and standardizes on the correct project ID.

BEGIN;

-- 1. Updated Google Calendar Sync Function (With Recursion Protection)
CREATE OR REPLACE FUNCTION public.on_agendamento_sync_google()
RETURNS TRIGGER AS $$
DECLARE
    payload JSONB;
    target_record JSONB;
BEGIN
    -- RECURSION PROTECTION: 
    -- Skip if ONLY google_event_id or updated_at were changed.
    -- This happens when the Edge Function updates the record with the Google Event ID.
    IF (TG_OP = 'UPDATE') THEN
        IF (row_to_json(OLD)::jsonb - 'google_event_id' - 'updated_at' = row_to_json(NEW)::jsonb - 'google_event_id' - 'updated_at') THEN
            RETURN NEW;
        END IF;
    END IF;

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
    -- Project ID: pouzpiulazrhutzzkbes
    PERFORM
        net.http_post(
            url := 'https://pouzpiulazrhutzzkbes.supabase.co/functions/v1/google-calendar-sync',
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
            ),
            body := payload
        );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Ensure Trigger exists with correct settings
DROP TRIGGER IF EXISTS tr_sync_agendamento_to_google ON public.agendamentos;
CREATE TRIGGER tr_sync_agendamento_to_google
    AFTER INSERT OR UPDATE OR DELETE ON public.agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION public.on_agendamento_sync_google();

COMMIT;
