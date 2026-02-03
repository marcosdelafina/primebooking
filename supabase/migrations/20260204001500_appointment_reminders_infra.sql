-- Migration: Appointment Reminders Infrastructure
-- Date: 2026-02-04
-- Description: Adds reminder tracking and automation for appointment notifications.

BEGIN;

-- 1. Add tracking column to agendamentos
ALTER TABLE public.agendamentos 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- 2. Create RPC to process reminders
-- This function can be called by a CRON job or manually
CREATE OR REPLACE FUNCTION public.process_appointment_reminders()
RETURNS INTEGER AS $$
DECLARE
    rec RECORD;
    count INTEGER := 0;
    target_url TEXT;
BEGIN
    -- Get the dynamic URL
    target_url := public.get_supabase_url();

    -- Find appointments starting in ~24 hours (between 23 and 25h to be safe with intervals)
    FOR rec IN 
        SELECT * FROM public.agendamentos
        WHERE status = 'confirmado'
          AND reminder_sent = FALSE
          AND data_inicio > (NOW() + INTERVAL '23 hours')
          AND data_inicio < (NOW() + INTERVAL '25 hours')
    LOOP
        -- Trigger the edge function
        PERFORM
            net.http_post(
                url := target_url || '/functions/v1/send-appointment-notification',
                headers := jsonb_build_object('Content-Type', 'application/json'),
                body := jsonb_build_object(
                    'type', 'REMINDER', -- Special type for reminders
                    'record', row_to_json(rec)::jsonb
                )
            );

        -- Mark as sent
        UPDATE public.agendamentos 
        SET reminder_sent = TRUE 
        WHERE id = rec.id;

        count := count + 1;
    END LOOP;

    RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
