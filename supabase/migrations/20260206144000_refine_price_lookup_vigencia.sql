-- Migration: Refine Price Lookup from Vigência
-- Date: 2026-02-06
-- Description: Ensures get_current_plan_price and initialization logic prioritize current vigência.

BEGIN;

-- 1. Refine get_current_plan_price to be more robust
CREATE OR REPLACE FUNCTION public.get_current_plan_price(p_plano_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    valor_mensal NUMERIC(12,2),
    valor_anual NUMERIC(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT pv.valor_mensal, pv.valor_anual
    FROM public.plano_valores pv
    WHERE pv.plano_id = p_plano_id
      AND p_date >= pv.data_inicio_vigencia
      AND (pv.data_fim_vigencia IS NULL OR p_date <= pv.data_fim_vigencia)
    ORDER BY pv.data_inicio_vigencia DESC -- If multiple, pick the most recent start
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 2. Update internal_initialize_billing to use dynamic price or fallback to latest vigencia
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
    
    -- 3. Fetch current pricing based on strictly valid vigencia
    IF v_plano_id IS NOT NULL THEN
        SELECT valor_mensal INTO v_valor_mensal FROM public.get_current_plan_price(v_plano_id);
        
        -- Fallback: If no CURRENTLY valid vigencia entry, pick the most recent past one or the future one closest to today
        IF v_valor_mensal IS NULL THEN
            SELECT pv.valor_mensal INTO v_valor_mensal
            FROM public.plano_valores pv
            WHERE pv.plano_id = v_plano_id
            ORDER BY ABS(EXTRACT(EPOCH FROM (CURRENT_DATE - pv.data_inicio_vigencia))) ASC
            LIMIT 1;
        END IF;
    END IF;

    -- 4. Initialize billing_empresa
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
        COALESCE(v_valor_mensal, 49.90), -- Final fallback if absolutely nothing found in plano_valores
        'ATIVA',
        to_char(NOW(), 'YYYY-MM'),
        NOW() + INTERVAL '1 month',
        NOW()
    )
    ON CONFLICT (empresa_id) DO UPDATE 
    SET billing_status = 'ATIVA',
        valor_mensal = EXCLUDED.valor_mensal,
        plano_id = EXCLUDED.plano_id,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Force backfill update for all companies to ensure they use the correct vigência price
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
