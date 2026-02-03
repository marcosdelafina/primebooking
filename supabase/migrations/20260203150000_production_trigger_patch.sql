-- Migration: Production Trigger Patch
-- Date: 2026-02-03
-- Description: Updates Edge Function URLs to use the current project ID (qckzsvnhtenmcgqmctfn) and adds the welcome email trigger.

BEGIN;

--------------------------------------------------------------------------------
-- 1. Fix Billing Notification Trigger
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.on_invoice_created_notify()
RETURNS TRIGGER AS $$
DECLARE
    auth_header TEXT;
    headers_json JSONB;
BEGIN
    -- Safely get the authorization header if available
    BEGIN
        headers_json := current_setting('request.headers', true)::jsonb;
        IF headers_json IS NOT NULL THEN
            auth_header := headers_json->>'authorization';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        auth_header := NULL;
    END;

    -- Only trigger for PENDING invoices (newly created)
    IF (TG_OP = 'INSERT' AND NEW.status = 'PENDING') THEN
        PERFORM
            net.http_post(
                url := 'https://qckzsvnhtenmcgqmctfn.supabase.co/functions/v1/send-billing-notification',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', COALESCE(auth_header, '')
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

--------------------------------------------------------------------------------
-- 2. Create Welcome Email Trigger
--------------------------------------------------------------------------------

-- Function to notify welcome email
CREATE OR REPLACE FUNCTION public.on_user_created_welcome_notify()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM
        net.http_post(
            url := 'https://qckzsvnhtenmcgqmctfn.supabase.co/functions/v1/send-user-welcome',
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
            ),
            body := jsonb_build_object(
                'table', 'usuarios',
                'record', row_to_json(NEW)
            )
        );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new users
DROP TRIGGER IF EXISTS tr_on_user_created_welcome ON public.usuarios;
CREATE TRIGGER tr_on_user_created_welcome
    AFTER INSERT ON public.usuarios
    FOR EACH ROW
    EXECUTE FUNCTION public.on_user_created_welcome_notify();

COMMIT;
