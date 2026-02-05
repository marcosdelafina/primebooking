-- Migration: Fix Triggers Authorization and Project URL
-- Date: 2026-02-05
-- Description: Consolidates all Edge Function triggers, adds Authorization headers, and ensures dynamic URL resolution.

BEGIN;

-- 1. Ensure keys exist in app_settings
INSERT INTO public.app_settings (key, value)
VALUES 
    ('supabase_url', 'https://PROJECT_ID.supabase.co'),
    ('supabase_service_role_key', 'YOUR_SERVICE_ROLE_KEY')
ON CONFLICT (key) DO NOTHING;

-- 2. Helper to get service key
CREATE OR REPLACE FUNCTION public.get_supabase_service_key()
RETURNS TEXT AS $$
DECLARE
    key TEXT;
BEGIN
    SELECT value INTO key FROM public.app_settings WHERE key = 'supabase_service_role_key';
    RETURN COALESCE(key, 'KEY_NOT_SET');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 3. Update Trigger Functions with Authorization Headers
--------------------------------------------------------------------------------
-- 3.1 Appointment Notifications
CREATE OR REPLACE FUNCTION public.on_agendamento_notify_email()
RETURNS TRIGGER AS $$
DECLARE
    payload JSONB;
BEGIN
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
            url := public.get_supabase_url() || '/functions/v1/send-appointment-notification',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || public.get_supabase_service_key()
            ),
            body := payload
        );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3.2 Google Calendar Sync
CREATE OR REPLACE FUNCTION public.on_agendamento_sync_google()
RETURNS TRIGGER AS $$
DECLARE
    payload JSONB;
    target_record JSONB;
BEGIN
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
            url := public.get_supabase_url() || '/functions/v1/google-calendar-sync',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || public.get_supabase_service_key()
            ),
            body := payload
        );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3.3 Billing Notifications
CREATE OR REPLACE FUNCTION public.on_invoice_created_notify()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.status = 'PENDING') THEN
        PERFORM
            net.http_post(
                url := public.get_supabase_url() || '/functions/v1/send-billing-notification',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || public.get_supabase_service_key()
                ),
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

-- 3.4 Welcome Email
CREATE OR REPLACE FUNCTION public.on_user_created_welcome_notify()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM
        net.http_post(
            url := public.get_supabase_url() || '/functions/v1/send-user-welcome',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || public.get_supabase_service_key()
            ),
            body := jsonb_build_object(
                'table', 'usuarios',
                'record', row_to_json(NEW)
            )
        );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
