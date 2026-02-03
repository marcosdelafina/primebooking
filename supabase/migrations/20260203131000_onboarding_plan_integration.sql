-- Migration: Integrate Plan management with Onboarding (RF-PLN-004)
-- Date: 2026-02-03
-- Description: Adds plano_id to billing_empresa and updates onboarding trigger.

BEGIN;

-- 1. Update billing_empresa to include a reference to the plan
ALTER TABLE public.billing_empresa ADD COLUMN IF NOT EXISTS plano_id UUID REFERENCES public.planos(id) ON DELETE SET NULL;

-- 2. Update handle_new_user to use current plan pricing
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_empresa_id UUID;
    user_nome TEXT;
    v_plano_id UUID;
    v_valor_mensal NUMERIC(12,2);
BEGIN
    -- Extract name from metadata or use email prefix
    user_nome := COALESCE(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        new.raw_user_meta_data->>'nome',
        split_part(new.email, '@', 1)
    );

    -- 1. Create a default enterprise for the new user
    INSERT INTO public.empresas (nome, slug, plano)
    VALUES (
        user_nome || ' Enterprise',
        'emp-' || lower(regexp_replace(user_nome, '[^a-zA-Z0-9]', '', 'g')) || '-' || substr(new.id::text, 1, 8),
        'basic'
    )
    RETURNING id INTO new_empresa_id;

    -- 2. Insert the user into our public.usuarios table
    INSERT INTO public.usuarios (id, empresa_id, nome, email, role)
    VALUES (
        new.id,
        new_empresa_id,
        user_nome,
        new.email,
        'admin' -- First user is the admin/owner
    );

    -- 3. Lookup the 'Básico' plan and its current pricing
    SELECT id INTO v_plano_id FROM public.planos WHERE nome = 'Básico' LIMIT 1;
    
    IF v_plano_id IS NOT NULL THEN
        SELECT valor_mensal INTO v_valor_mensal FROM public.get_current_plan_price(v_plano_id);
    END IF;

    -- 4. Initialize billing_empresa with the current price
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
        new_empresa_id,
        v_plano_id,
        COALESCE(v_valor_mensal, 0), -- Fallback to 0 if no price found
        'ATIVA',
        to_char(NOW(), 'YYYY-MM'),
        NOW() + INTERVAL '1 month',
        NOW()
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMIT;
