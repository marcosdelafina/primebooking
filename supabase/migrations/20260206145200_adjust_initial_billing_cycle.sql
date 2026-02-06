-- Migration: Adjust Initial Billing Cycle
-- Date: 2026-02-06
-- Description: Sets initial billing cycle to the previous month for new establishments.

BEGIN;

-- 1. Update internal_initialize_billing to use previous month as primary cycle
CREATE OR REPLACE FUNCTION public.internal_initialize_billing(p_empresa_id UUID)
RETURNS VOID AS $$
DECLARE
    v_plano_id UUID;
    v_valor_mensal NUMERIC(12,2);
    v_plano_nome TEXT;
BEGIN
    -- 1. Get the current plan name from empresa
    SELECT plano INTO v_plano_nome FROM public.empresas WHERE id = p_empresa_id;
    
    -- 2. Lookup the plan ID
    SELECT id INTO v_plano_id FROM public.planos WHERE nome = COALESCE(v_plano_nome, 'Básico') LIMIT 1;
    
    -- 3. Fetch pricing based on vigencia
    IF v_plano_id IS NOT NULL THEN
        SELECT valor_mensal INTO v_valor_mensal FROM public.get_current_plan_price(v_plano_id);
        
        -- Fallback
        IF v_valor_mensal IS NULL THEN
            SELECT pv.valor_mensal INTO v_valor_mensal
            FROM public.plano_valores pv
            WHERE pv.plano_id = v_plano_id
            ORDER BY ABS(EXTRACT(EPOCH FROM (CURRENT_DATE - pv.data_inicio_vigencia))) ASC
            LIMIT 1;
        END IF;
    END IF;

    -- 4. Initialize billing_empresa (Initial cycle = Previous Month)
    INSERT INTO public.billing_empresa (
        empresa_id, 
        plano_id, 
        valor_mensal, 
        billing_status,
        ciclo_atual,
        data_renovacao,
        data_inicio_ciclo
    )
    VALUES (
        p_empresa_id,
        v_plano_id,
        COALESCE(v_valor_mensal, 49.90),
        'ATIVA',
        to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'),
        date_trunc('month', CURRENT_DATE), -- Start of current month
        date_trunc('month', CURRENT_DATE - INTERVAL '1 month') -- Start of previous month
    )
    ON CONFLICT (empresa_id) DO UPDATE 
    SET billing_status = 'ATIVA',
        ciclo_atual = EXCLUDED.ciclo_atual,
        data_renovacao = EXCLUDED.data_renovacao,
        data_inicio_ciclo = EXCLUDED.data_inicio_ciclo,
        valor_mensal = EXCLUDED.valor_mensal,
        plano_id = EXCLUDED.plano_id,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Synchronize existing companies (Backfill)
DO $$
DECLARE
    emp RECORD;
BEGIN
    FOR emp IN SELECT id FROM public.empresas LOOP
        PERFORM public.internal_initialize_billing(emp.id);
    END LOOP;
END;
$$;

COMMIT;
