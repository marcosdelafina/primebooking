-- Migration: Hard Repair Billing & Final Sync
-- Date: 2026-02-03
-- Description: Standardizes all plans to 'Básico', ensures price exists, and repairs zero-value billing records.

BEGIN;

-- 1. Standardize Plan Names (Case Insensitive)
UPDATE public.empresas 
SET plano = 'Básico' 
WHERE lower(plano) IN ('basico', 'básico', 'basic') OR plano IS NULL;

-- 2. Repair 'Básico' plan billing cache
DO $$
DECLARE
    v_plano_id UUID;
    v_valor NUMERIC(12,2);
BEGIN
    -- 1. Get existing Básico plan ID
    SELECT id INTO v_plano_id FROM public.planos WHERE nome = 'Básico' LIMIT 1;

    -- 2. Get current price
    SELECT valor_mensal INTO v_valor FROM public.get_current_plan_price(v_plano_id);

    -- 3. Repair billing_empresa cache
    UPDATE public.billing_empresa
    SET 
        plano_id = v_plano_id,
        valor_mensal = COALESCE(v_valor, 39.90)
    WHERE (valor_mensal = 0 OR valor_mensal IS NULL OR plano_id IS NULL)
    AND empresa_id IN (SELECT id FROM public.empresas WHERE plano = 'Básico');
END $$;

-- 3. Robust Billing Function Update
-- Includes better logging and explicit price fallback
CREATE OR REPLACE FUNCTION public.generate_monthly_billing(
    target_scope TEXT DEFAULT 'ALL',
    target_empresa_id UUID DEFAULT NULL,
    is_dry_run BOOLEAN DEFAULT TRUE
) RETURNS UUID AS $$
DECLARE
    current_month TEXT := to_char(NOW(), 'YYYY-MM');
    processed_count INTEGER := 0;
    error_count INTEGER := 0;
    emp RECORD;
    new_run_id UUID;
    v_valor_mensal NUMERIC(12,2);
    v_plano_id UUID;
    v_plano_nome TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Somente administradores globais podem gerar faturamento.';
    END IF;

    INSERT INTO public.billing_runs (status, scope, is_dry_run, metadata)
    VALUES ('RUNNING', target_scope, is_dry_run, jsonb_build_object('empresa_id', target_empresa_id))
    RETURNING id INTO new_run_id;

    FOR emp IN 
        SELECT id, nome, plano FROM public.empresas 
        WHERE (target_scope = 'SINGLE' AND id = target_empresa_id)
           OR (target_scope = 'ALL')
    LOOP
        BEGIN
            -- 1. Try to get value from cache
            SELECT valor_mensal, plano_id INTO v_valor_mensal, v_plano_id 
            FROM public.billing_empresa WHERE empresa_id = emp.id;
            
            -- 2. If zero/null, try price lookup for the linked plan
            IF v_valor_mensal IS NULL OR v_valor_mensal = 0 THEN
                IF v_plano_id IS NOT NULL THEN
                    SELECT valor_mensal INTO v_valor_mensal FROM public.get_current_plan_price(v_plano_id);
                END IF;
            END IF;

            -- 3. If STILL zero, try to find plan by name
            IF v_valor_mensal IS NULL OR v_valor_mensal = 0 THEN
                v_plano_nome := COALESCE(emp.plano, 'Básico');
                SELECT id INTO v_plano_id FROM public.planos WHERE nome = v_plano_nome LIMIT 1;
                IF v_plano_id IS NOT NULL THEN
                    SELECT valor_mensal INTO v_valor_mensal FROM public.get_current_plan_price(v_plano_id);
                    -- Update cache for next time
                    UPDATE public.billing_empresa SET plano_id = v_plano_id, valor_mensal = COALESCE(v_valor_mensal,0) WHERE empresa_id = emp.id;
                END IF;
            END IF;
            
            v_valor_mensal := COALESCE(v_valor_mensal, 0);

            IF is_dry_run THEN
                INSERT INTO public.billing_run_logs (run_id, empresa_id, level, message)
                VALUES (new_run_id, emp.id, 'INFO', 'Simulação: Empresa ' || emp.nome || ' (Plano: ' || COALESCE(emp.plano, 'N/A') || ') -> Valor: R$ ' || v_valor_mensal);
                processed_count := processed_count + 1;
            ELSE
                -- Real Execution
                INSERT INTO public.billing_empresa (
                    empresa_id, ciclo_atual, data_renovacao, data_inicio_ciclo, billing_status, valor_mensal, plano_id
                )
                VALUES (
                    emp.id, current_month, NOW() + INTERVAL '1 month', NOW(), 'ATIVA', v_valor_mensal, v_plano_id
                )
                ON CONFLICT (empresa_id) DO UPDATE SET
                    ciclo_atual = EXCLUDED.ciclo_atual,
                    data_renovacao = EXCLUDED.data_renovacao,
                    data_inicio_ciclo = EXCLUDED.data_inicio_ciclo,
                    valor_mensal = CASE WHEN billing_empresa.valor_mensal = 0 THEN EXCLUDED.valor_mensal ELSE billing_empresa.valor_mensal END,
                    plano_id = COALESCE(billing_empresa.plano_id, EXCLUDED.plano_id),
                    updated_at = NOW()
                WHERE billing_empresa.ciclo_atual IS DISTINCT FROM current_month;

                IF FOUND THEN
                    INSERT INTO public.subscription_invoices (empresa_id, amount, status, due_date, period)
                    VALUES (emp.id, v_valor_mensal, 'PENDING', (CURRENT_DATE + INTERVAL '5 days')::DATE, current_month);

                    INSERT INTO public.billing_run_logs (run_id, empresa_id, level, message)
                    VALUES (new_run_id, emp.id, 'INFO', 'Faturamento gerado: R$ ' || v_valor_mensal);
                    processed_count := processed_count + 1;
                ELSE
                    INSERT INTO public.billing_run_logs (run_id, empresa_id, level, message)
                    VALUES (new_run_id, emp.id, 'INFO', 'Já faturado para o ciclo ' || current_month);
                END IF;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            INSERT INTO public.billing_run_logs (run_id, empresa_id, level, message)
            VALUES (new_run_id, emp.id, 'ERROR', 'Falha: ' || SQLERRM);
        END;
    END LOOP;

    UPDATE public.billing_runs 
    SET status = 'COMPLETED',
        completed_at = NOW(),
        metadata = metadata || jsonb_build_object('processed', processed_count, 'errors', error_count)
    WHERE id = new_run_id;

    RETURN new_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
