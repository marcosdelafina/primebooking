-- Migration: Repair Zero Billing Values
-- Date: 2026-02-03
-- Description: Forces a sync of valor_mensal from plano_valores to billing_empresa for all active companies.

BEGIN;

-- 1. Ensure all companies are linked to the correct plano_id based on their 'plano' text field
DO $$
DECLARE
    v_plano_id UUID;
    v_plano_nome TEXT;
BEGIN
    -- Iterate through each plan name we have
    FOR v_plano_nome IN SELECT DISTINCT nome FROM public.planos LOOP
        SELECT id INTO v_plano_id FROM public.planos WHERE nome = v_plano_nome LIMIT 1;
        
        -- Update billing_empresa for companies that say they are on this plan but aren't linked or have zero price
        UPDATE public.billing_empresa be
        SET 
            plano_id = v_plano_id,
            valor_mensal = (SELECT valor_mensal FROM public.get_current_plan_price(v_plano_id))
        FROM public.empresas e
        WHERE e.id = be.empresa_id
        AND (e.plano = v_plano_nome OR (e.plano IS NULL AND v_plano_nome = 'Básico'))
        AND (be.plano_id IS NULL OR be.valor_mensal = 0 OR be.valor_mensal IS NULL);
    END LOOP;
END $$;

-- 2. Final sync: If anything still has 0 but we can find a price, set it.
UPDATE public.billing_empresa be
SET valor_mensal = pv.valor_mensal
FROM public.plano_valores pv
WHERE be.plano_id = pv.plano_id
AND (be.valor_mensal = 0 OR be.valor_mensal IS NULL)
AND pv.data_inicio_vigencia <= CURRENT_DATE
AND (pv.data_fim_vigencia IS NULL OR pv.data_fim_vigencia >= CURRENT_DATE);

-- 3. Update generate_monthly_billing to be more defensive (optional but good)
-- If valor_mensal is still 0 in billing_empresa, try to look it up on the fly during billing
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
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Somente administradores globais podem gerar faturamento.';
    END IF;

    INSERT INTO public.billing_runs (status, scope, is_dry_run, metadata)
    VALUES ('RUNNING', target_scope, is_dry_run, jsonb_build_object('empresa_id', target_empresa_id))
    RETURNING id INTO new_run_id;

    FOR emp IN 
        SELECT id, nome FROM public.empresas 
        WHERE (target_scope = 'SINGLE' AND id = target_empresa_id)
           OR (target_scope = 'ALL')
    LOOP
        BEGIN
            -- 1. Try to get value from billing_empresa cache
            SELECT valor_mensal, plano_id INTO v_valor_mensal, v_plano_id 
            FROM public.billing_empresa WHERE empresa_id = emp.id;
            
            -- 2. If zero or null, try a dynamic lookup from plano_valores
            IF v_valor_mensal IS NULL OR v_valor_mensal = 0 THEN
                IF v_plano_id IS NOT NULL THEN
                    SELECT valor_mensal INTO v_valor_mensal FROM public.get_current_plan_price(v_plano_id);
                END IF;
            END IF;
            
            v_valor_mensal := COALESCE(v_valor_mensal, 0);

            IF is_dry_run THEN
                INSERT INTO public.billing_run_logs (run_id, empresa_id, level, message)
                VALUES (new_run_id, emp.id, 'INFO', 'Simulação: Empresa ' || emp.nome || ' seria processada para o ciclo ' || current_month || ' (Valor: ' || v_valor_mensal || ')');
                processed_count := processed_count + 1;
            ELSE
                -- Real Execution logic...
                INSERT INTO public.billing_empresa (
                    empresa_id, ciclo_atual, data_renovacao, data_inicio_ciclo, billing_status, valor_mensal
                )
                VALUES (
                    emp.id, current_month, NOW() + INTERVAL '1 month', NOW(), 'ATIVA', v_valor_mensal
                )
                ON CONFLICT (empresa_id) DO UPDATE SET
                    ciclo_atual = EXCLUDED.ciclo_atual,
                    data_renovacao = EXCLUDED.data_renovacao,
                    data_inicio_ciclo = EXCLUDED.data_inicio_ciclo,
                    valor_mensal = CASE WHEN billing_empresa.valor_mensal = 0 THEN EXCLUDED.valor_mensal ELSE billing_empresa.valor_mensal END,
                    updated_at = NOW()
                WHERE billing_empresa.ciclo_atual IS DISTINCT FROM current_month;

                IF FOUND THEN
                    INSERT INTO public.subscription_invoices (empresa_id, amount, status, due_date, period)
                    VALUES (emp.id, v_valor_mensal, 'PENDING', (CURRENT_DATE + INTERVAL '5 days')::DATE, current_month);

                    INSERT INTO public.billing_run_logs (run_id, empresa_id, level, message)
                    VALUES (new_run_id, emp.id, 'INFO', 'Faturamento e fatura gerados com sucesso para o ciclo ' || current_month || ' (Valor: ' || v_valor_mensal || ')');
                    processed_count := processed_count + 1;
                ELSE
                    INSERT INTO public.billing_run_logs (run_id, empresa_id, level, message)
                    VALUES (new_run_id, emp.id, 'INFO', 'Empresa já possui faturamento para o ciclo ' || current_month || '. Pulando...');
                END IF;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            INSERT INTO public.billing_run_logs (run_id, empresa_id, level, message)
            VALUES (new_run_id, emp.id, 'ERROR', 'Erro ao processar: ' || SQLERRM);
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
