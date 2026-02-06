-- Migration: Fix Billing Initialization (Restore Lost Logic)
-- Date: 2026-02-06
-- Description: Restores billing_empresa initialization in triggers and repairs, and backfills missing records.

BEGIN;

-- 1. Helper function to create billing record (to avoid redundancy)
CREATE OR REPLACE FUNCTION public.internal_initialize_billing(p_empresa_id UUID)
RETURNS VOID AS $$
DECLARE
    v_plano_id UUID;
    v_valor_mensal NUMERIC(12,2);
BEGIN
    -- 1. Lookup the 'Básico' plan
    SELECT id INTO v_plano_id FROM public.planos WHERE nome = 'Básico' LIMIT 1;
    
    -- 2. Fetch current pricing
    IF v_plano_id IS NOT NULL THEN
        SELECT valor_mensal INTO v_valor_mensal FROM public.get_current_plan_price(v_plano_id);
    END IF;

    -- 3. Initialize billing_empresa
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
        COALESCE(v_valor_mensal, 49.90), -- Fallback to 49.90 (standard Basic price) if price not found
        'ATIVA',
        to_char(NOW(), 'YYYY-MM'),
        NOW() + INTERVAL '1 month',
        NOW()
    )
    ON CONFLICT (empresa_id) DO UPDATE 
    SET billing_status = 'ATIVA',
        valor_mensal = EXCLUDED.valor_mensal,
        plano_id = EXCLUDED.plano_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Update handle_new_user with billing initialization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_empresa_id UUID;
    user_nome TEXT;
    estab_nome TEXT;
    base_slug TEXT;
    final_slug TEXT;
    v_is_client BOOLEAN;
BEGIN
    -- Detect if user is a client (end-customer)
    v_is_client := COALESCE((new.raw_user_meta_data->>'is_client')::BOOLEAN, false);
    
    -- If the user is a client, just return and do nothing here.
    IF v_is_client IS TRUE THEN
        RETURN new;
    END IF;

    -- Business Owner Flow
    user_nome := COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1));
    estab_nome := COALESCE(new.raw_user_meta_data->>'nome_estabelecimento', user_nome || ' Enterprise');

    -- Generate a clean slug
    base_slug := lower(regexp_replace(estab_nome, '[^a-zA-Z0-9]', '', 'g'));
    IF base_slug = '' THEN base_slug := 'emp'; END IF;

    -- Check for collision
    IF EXISTS (SELECT 1 FROM public.empresas WHERE slug = base_slug) THEN
        final_slug := base_slug || '-' || substr(new.id::text, 1, 8);
    ELSE
        final_slug := base_slug;
    END IF;

    -- 1. Create enterprise
    INSERT INTO public.empresas (nome, slug, plano)
    VALUES (estab_nome, final_slug, 'Básico')
    RETURNING id INTO new_empresa_id;

    -- 2. Insert the user
    INSERT INTO public.usuarios (id, empresa_id, nome, email, role)
    VALUES (new.id, new_empresa_id, user_nome, new.email, 'admin');

    -- 3. Initialize Billing Info (Restored Logic)
    PERFORM public.internal_initialize_billing(new_empresa_id);

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Update debug_and_repair_user with billing initialization
CREATE OR REPLACE FUNCTION public.debug_and_repair_user(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_auth_exists BOOLEAN;
    v_public_exists BOOLEAN;
    v_empresa_id UUID;
    v_user_email TEXT;
    v_user_nome TEXT;
    v_is_client BOOLEAN;
    v_base_slug TEXT;
    v_final_slug TEXT;
BEGIN
    -- 1. Check if user exists in auth.users
    SELECT 
        EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id),
        email, 
        COALESCE(raw_user_meta_data->>'nome', split_part(email, '@', 1)),
        COALESCE((raw_user_meta_data->>'is_client')::BOOLEAN, false)
    INTO v_auth_exists, v_user_email, v_user_nome, v_is_client
    FROM auth.users WHERE id = p_user_id;
    
    IF NOT v_auth_exists THEN
        RETURN json_build_object('status', 'error', 'message', 'User does not exist in auth.users');
    END IF;

    IF v_is_client IS TRUE THEN
        RETURN json_build_object('status', 'ok', 'message', 'User is a client, skipping business profile repair');
    END IF;

    -- 2. Check if user exists in public.usuarios
    SELECT empresa_id INTO v_empresa_id FROM public.usuarios WHERE id = p_user_id;
    v_public_exists := v_empresa_id IS NOT NULL;
    
    IF NOT v_public_exists THEN
        -- 3. Repair logic for missing profile
        v_base_slug := lower(regexp_replace(v_user_nome, '[^a-zA-Z0-9]', '', 'g'));
        IF v_base_slug = '' THEN v_base_slug := 'emp'; END IF;

        IF EXISTS (SELECT 1 FROM public.empresas WHERE slug = v_base_slug) THEN
            v_final_slug := v_base_slug || '-' || substr(p_user_id::text, 1, 8);
        ELSE
            v_final_slug := v_base_slug;
        END IF;

        INSERT INTO public.empresas (nome, slug, plano)
        VALUES (v_user_nome || ' Enterprise', v_final_slug, 'Básico')
        ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome 
        RETURNING id INTO v_empresa_id;

        INSERT INTO public.usuarios (id, empresa_id, nome, email, role)
        VALUES (p_user_id, v_empresa_id, v_user_nome, v_user_email, 'admin');
    END IF;

    -- 4. In all cases (already exists or just created), ensure billing is initialized
    PERFORM public.internal_initialize_billing(v_empresa_id);

    RETURN json_build_object(
        'status', CASE WHEN v_public_exists THEN 'ok' ELSE 'repaired' END,
        'message', 'User profile and billing verified/repaired',
        'empresa_id', v_empresa_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('status', 'error', 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Backfill: Initialize billing for all existing enterprises that are missing it
DO $$
DECLARE
    emp RECORD;
BEGIN
    FOR emp IN 
        SELECT id FROM public.empresas e
        WHERE NOT EXISTS (SELECT 1 FROM public.billing_empresa b WHERE b.empresa_id = e.id)
    LOOP
        PERFORM public.internal_initialize_billing(emp.id);
    END LOOP;
END;
$$;

COMMIT;
