-- Migration: Setup Billing Notification Trigger
-- Date: 2026-02-03
-- Description: Enables pg_net and creates a trigger to notify the send-billing-notification Edge Function.

-- 1. Enable the pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- 2. Create the trigger function
CREATE OR REPLACE FUNCTION public.on_invoice_created_notify()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger for PENDING invoices (newly created)
    IF (TG_OP = 'INSERT' AND NEW.status = 'PENDING') THEN
        PERFORM
            net.http_post(
                url := 'https://pouzpiulazrhutzzkbes.supabase.co/functions/v1/send-billing-notification',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || current_setting('request.headers', true)::jsonb->>'authorization' -- Try to pass through authorization if available
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

-- 3. Create the trigger
DROP TRIGGER IF EXISTS tr_on_invoice_created ON public.subscription_invoices;
CREATE TRIGGER tr_on_invoice_created
    AFTER INSERT ON public.subscription_invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.on_invoice_created_notify();
