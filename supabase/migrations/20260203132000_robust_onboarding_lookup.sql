-- Migration: Make onboarding plan lookup more robust
-- Date: 2026-02-03
-- Description: Updates handle_new_user to support both 'Básico' and 'basic' and sync legacy column.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_empresa_id UUID;
    user_nome TEXT;
    v_plano_id UUID;
    v_plano_nome TEXT;
    v_valor_mensal NUMERIC(12,2);
BEGIN
    -- Extract name from metadata or use email prefix
    user_nome := COALESCE(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        new.raw_user_meta_data->>'nome',
        split_part(new.email, '@', 1)
    );

    -- 1. Lookup the default plan (Básico or basic)
    SELECT id, nome INTO v_plano_id, v_plano_nome 
    FROM public.planos 
    WHERE nome IN ('Básico', 'basic') 
    LIMIT 1;
    
    -- 2. Create a default enterprise for the new user
    -- Sync legacy 'plano' column with the actual plan name found
    INSERT INTO public.empresas (nome, slug, plano)
    VALUES (
        user_nome || ' Enterprise',
        'emp-' || lower(regexp_replace(user_nome, '[^a-zA-Z0-9]', '', 'g')) || '-' || substr(new.id::text, 1, 8),
        COALESCE(v_plano_nome, 'basic')
    )
    RETURNING id INTO new_empresa_id;

    -- 3. Insert the user into our public.usuarios table
    INSERT INTO public.usuarios (id, empresa_id, nome, email, role)
    VALUES (
        new.id,
        new_empresa_id,
        user_nome,
        new.email,
        'admin' -- First user is the admin/owner
    );

    -- 4. Get current pricing for the plan
    IF v_plano_id IS NOT NULL THEN
        SELECT valor_mensal INTO v_valor_mensal FROM public.get_current_plan_price(v_plano_id);
    END IF;

    -- 5. Initialize billing_empresa with the current price
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
