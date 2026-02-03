-- Migration: Setup Appointment Notification Trigger
-- Date: 2026-02-03
-- Description: Creates a trigger to notify the send-appointment-notification Edge Function on INSERT or UPDATE of agendamentos.

BEGIN;

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION public.on_agendamento_notify_email()
RETURNS TRIGGER AS $$
DECLARE
    payload JSONB;
BEGIN
    -- Determine which record to send
    -- We primarily care about INSERT (new booking) and UPDATE (status change)
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;

    -- Build the payload
    payload := jsonb_build_object(
        'type', TG_OP,
        'table', 'agendamentos',
        'record', row_to_json(NEW)::jsonb,
        'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb ELSE NULL END
    );

    -- Call the Edge Function
    -- Project ID: qckzsvnhtenmcgqmctfn
    PERFORM
        net.http_post(
            url := 'https://qckzsvnhtenmcgqmctfn.supabase.co/functions/v1/send-appointment-notification',
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
            ),
            body := payload
        );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS tr_notify_appointment_email ON public.agendamentos;
CREATE TRIGGER tr_notify_appointment_email
    AFTER INSERT OR UPDATE ON public.agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION public.on_agendamento_notify_email();

COMMIT;
