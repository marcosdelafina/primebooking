-- Migration: Billing Automator RPC
-- Date: 2026-02-02
-- Description: RPC to generate monthly billing records.

BEGIN;

-- Function to generate monthly billing
-- Returns number of records created/updated
CREATE OR REPLACE FUNCTION public.generate_monthly_billing(
    target_scope TEXT DEFAULT 'ALL',
    target_empresa_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    current_month TEXT := to_char(NOW(), 'YYYY-MM');
    count INTEGER := 0;
    emp RECORD;
BEGIN
    -- Only global admins can run this
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Somente administradores globais podem gerar faturamento.';
    END IF;

    FOR emp IN 
        SELECT id FROM public.empresas 
        WHERE (target_scope = 'SINGLE' AND id = target_empresa_id)
           OR (target_scope = 'ALL')
    LOOP
        -- Check if billing record exists for this company
        -- If it doesn't exist, create initial record
        -- If it exists, update the ciclo_atual if it's new
        
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
            count := count + 1;
        END IF;
    END LOOP;

    RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add uniqueness constraint to avoid duplicate billing per company in this simplified model
-- Wait, the table already has empresa_id as a key concept, but we use ON CONFLICT (empresa_id)
-- so it needs a UNIQUE constraint if it doesn't have one (besides PK).
ALTER TABLE public.billing_empresa DROP CONSTRAINT IF EXISTS billing_empresa_empresa_id_key;
ALTER TABLE public.billing_empresa ADD CONSTRAINT billing_empresa_empresa_id_key UNIQUE (empresa_id);

COMMIT;
