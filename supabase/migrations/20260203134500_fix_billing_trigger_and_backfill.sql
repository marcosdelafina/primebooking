-- Migration: Fix billing trigger and backfill legacy companies
-- Date: 2026-02-03
-- Description: Fixes the JSON parsing error in the trigger and ensures all companies have billing data.

BEGIN;

--------------------------------------------------------------------------------
-- 1. Fix the trigger function (Defensive JSON parsing)
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
                url := 'https://pouzpiulazrhutzzkbes.supabase.co/functions/v1/send-billing-notification',
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
-- 2. Backfill billing_empresa for legacy companies
--------------------------------------------------------------------------------

DO $$
DECLARE
    v_plano_id UUID;
    v_valor_mensal NUMERIC(12,2);
    v_emp_id UUID;
BEGIN
    -- 1. Get the 'Básico' plan ID
    SELECT id INTO v_plano_id FROM public.planos WHERE nome = 'Básico' LIMIT 1;
    
    -- If 'Básico' doesn't exist, try to find any plan or create a placeholder if necessary
    -- But based on previous steps, it should exist.
    IF v_plano_id IS NOT NULL THEN
        -- Get current price for Básico
        SELECT valor_mensal INTO v_valor_mensal FROM public.get_current_plan_price(v_plano_id);
    END IF;

    -- 2. Insert missing billing records
    -- Using a loop or an INSERT SELECT
    INSERT INTO public.billing_empresa (
        empresa_id, 
        plano_id, 
        valor_mensal, 
        billing_status,
        data_onboarding
    )
    SELECT 
        e.id, 
        v_plano_id, 
        COALESCE(v_valor_mensal, 0), 
        'ATIVA',
        e.created_at
    FROM public.empresas e
    LEFT JOIN public.billing_empresa be ON e.id = be.empresa_id
    WHERE be.id IS NULL
    ON CONFLICT (empresa_id) DO NOTHING;

    -- 3. Sync pricing for legacy billing records that have 0 or NULL price but are linked to a plan
    UPDATE public.billing_empresa be
    SET 
        plano_id = COALESCE(be.plano_id, v_plano_id),
        valor_mensal = (SELECT valor_mensal FROM public.get_current_plan_price(COALESCE(be.plano_id, v_plano_id)))
    WHERE (be.valor_mensal = 0 OR be.valor_mensal IS NULL)
    AND EXISTS (SELECT 1 FROM public.planos WHERE id = COALESCE(be.plano_id, v_plano_id));

END $$;

COMMIT;
