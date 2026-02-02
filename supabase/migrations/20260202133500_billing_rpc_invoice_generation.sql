-- Update generate_monthly_billing RPC to create invoices
-- Date: 2026-02-02

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
BEGIN
    -- Only global admins can run this
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Somente administradores globais podem gerar faturamento.';
    END IF;

    -- Create run record
    INSERT INTO public.billing_runs (status, scope, is_dry_run, metadata)
    VALUES ('RUNNING', target_scope, is_dry_run, jsonb_build_object('empresa_id', target_empresa_id))
    RETURNING id INTO new_run_id;

    FOR emp IN 
        SELECT id, nome FROM public.empresas 
        WHERE (target_scope = 'SINGLE' AND id = target_empresa_id)
           OR (target_scope = 'ALL')
    LOOP
        BEGIN
            -- Get monthly value for the company
            SELECT valor_mensal INTO v_valor_mensal FROM public.billing_empresa WHERE empresa_id = emp.id;
            IF v_valor_mensal IS NULL THEN
                v_valor_mensal := 0; -- Or skip if not configured
            END IF;

            IF is_dry_run THEN
                -- Simulation: Just log that we would process
                INSERT INTO public.billing_run_logs (run_id, empresa_id, level, message)
                VALUES (new_run_id, emp.id, 'INFO', 'Simulação: Empresa ' || emp.nome || ' seria processada para o ciclo ' || current_month || ' (Valor: ' || v_valor_mensal || ')');
                processed_count := processed_count + 1;
            ELSE
                -- Real Execution
                INSERT INTO public.billing_empresa (
                    empresa_id, 
                    ciclo_atual, 
                    data_renovacao, 
                    data_inicio_ciclo,
                    billing_status
                )
                VALUES (
                    emp.id, 
                    current_month, 
                    NOW() + INTERVAL '1 month',
                    NOW(),
                    'ATIVA'
                )
                ON CONFLICT (empresa_id) DO UPDATE SET
                    ciclo_atual = EXCLUDED.ciclo_atual,
                    data_renovacao = EXCLUDED.data_renovacao,
                    data_inicio_ciclo = EXCLUDED.data_inicio_ciclo,
                    updated_at = NOW()
                WHERE billing_empresa.ciclo_atual IS DISTINCT FROM current_month;

                IF FOUND THEN
                    -- Create the invoice
                    INSERT INTO public.subscription_invoices (
                        empresa_id,
                        amount,
                        status,
                        due_date,
                        period
                    )
                    VALUES (
                        emp.id,
                        v_valor_mensal,
                        'PENDING',
                        (CURRENT_DATE + INTERVAL '5 days')::DATE, -- Default 5 days due
                        current_month
                    );

                    INSERT INTO public.billing_run_logs (run_id, empresa_id, level, message)
                    VALUES (new_run_id, emp.id, 'INFO', 'Faturamento e fatura gerados com sucesso para o ciclo ' || current_month);
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

    -- Finalize run record
    UPDATE public.billing_runs 
    SET status = 'COMPLETED',
        completed_at = NOW(),
        metadata = metadata || jsonb_build_object('processed', processed_count, 'errors', error_count)
    WHERE id = new_run_id;

    RETURN new_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
