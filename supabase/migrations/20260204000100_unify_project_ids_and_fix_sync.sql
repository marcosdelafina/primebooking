-- Migration: Unified Project ID and Robust Sync Triggers
-- Date: 2026-02-04
-- Description: Sets ALL Edge Function triggers to use project 'qckzsvnhtenmcgqmctfn' and adds recursion protection.

BEGIN;

-- 1. Appointment Notifications (INSERT/UPDATE)
CREATE OR REPLACE FUNCTION public.on_agendamento_notify_email()
RETURNS TRIGGER AS $$
DECLARE
    payload JSONB;
BEGIN
    -- Skip if only internal health checks or sync fields change
    IF (TG_OP = 'UPDATE') THEN
        IF (row_to_json(OLD)::jsonb - 'updated_at' = row_to_json(NEW)::jsonb - 'updated_at') THEN
            RETURN NEW;
        END IF;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;

    payload := jsonb_build_object(
        'type', TG_OP,
        'table', 'agendamentos',
        'record', row_to_json(NEW)::jsonb,
        'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb ELSE NULL END
    );

    PERFORM
        net.http_post(
            url := 'https://qckzsvnhtenmcgqmctfn.supabase.co/functions/v1/send-appointment-notification',
            headers := jsonb_build_object('Content-Type', 'application/json'),
            body := payload
        );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Google Calendar Sync (INSERT/UPDATE/DELETE)
CREATE OR REPLACE FUNCTION public.on_agendamento_sync_google()
RETURNS TRIGGER AS $$
DECLARE
    payload JSONB;
    target_record JSONB;
BEGIN
    -- RECURSION PROTECTION: 
    -- Skip if ONLY google_event_id or updated_at were changed.
    IF (TG_OP = 'UPDATE') THEN
        IF (row_to_json(OLD)::jsonb - 'google_event_id' - 'updated_at' = row_to_json(NEW)::jsonb - 'google_event_id' - 'updated_at') THEN
            RETURN NEW;
        END IF;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        target_record := row_to_json(OLD)::jsonb;
    ELSE
        target_record := row_to_json(NEW)::jsonb;
    END IF;

    payload := jsonb_build_object(
        'type', TG_OP,
        'table', 'agendamentos',
        'record', target_record,
        'old_record', CASE WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END
    );

    PERFORM
        net.http_post(
            url := 'https://qckzsvnhtenmcgqmctfn.supabase.co/functions/v1/google-calendar-sync',
            headers := jsonb_build_object('Content-Type', 'application/json'),
            body := payload
        );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Billing Notifications
CREATE OR REPLACE FUNCTION public.on_invoice_created_notify()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.status = 'PENDING') THEN
        PERFORM
            net.http_post(
                url := 'https://qckzsvnhtenmcgqmctfn.supabase.co/functions/v1/send-billing-notification',
                headers := jsonb_build_object('Content-Type', 'application/json'),
                body := jsonb_build_object(
                    'empresa_id', NEW.empresa_id,
                    'invoice_id', NEW.id,
                    'amount', NEW.amount,
                    'due_date', NEW.due_date::text
                )
            );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Welcome Email
CREATE OR REPLACE FUNCTION public.on_user_created_welcome_notify()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM
        net.http_post(
            url := 'https://qckzsvnhtenmcgqmctfn.supabase.co/functions/v1/send-user-welcome',
            headers := jsonb_build_object('Content-Type', 'application/json'),
            body := jsonb_build_object(
                'table', 'usuarios',
                'record', row_to_json(NEW)
            )
        );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-apply all triggers to ensure they use the updated functions
DROP TRIGGER IF EXISTS tr_notify_appointment_email ON public.agendamentos;
CREATE TRIGGER tr_notify_appointment_email
    AFTER INSERT OR UPDATE ON public.agendamentos
    FOR EACH ROW EXECUTE FUNCTION public.on_agendamento_notify_email();

DROP TRIGGER IF EXISTS tr_sync_agendamento_to_google ON public.agendamentos;
CREATE TRIGGER tr_sync_agendamento_to_google
    AFTER INSERT OR UPDATE OR DELETE ON public.agendamentos
    FOR EACH ROW EXECUTE FUNCTION public.on_agendamento_sync_google();

DROP TRIGGER IF EXISTS tr_on_invoice_created ON public.subscription_invoices;
CREATE TRIGGER tr_on_invoice_created
    AFTER INSERT ON public.subscription_invoices
    FOR EACH ROW EXECUTE FUNCTION public.on_invoice_created_notify();

DROP TRIGGER IF EXISTS tr_on_user_created_welcome ON public.usuarios;
CREATE TRIGGER tr_on_user_created_welcome
    AFTER INSERT ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION public.on_user_created_welcome_notify();

COMMIT;
