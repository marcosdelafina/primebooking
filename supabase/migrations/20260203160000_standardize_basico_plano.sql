-- Migration: Standardize Plan Name to 'Básico'
-- Date: 2026-02-03
-- Description: Updates handle_new_user and debug_and_repair_user to use 'Básico' and converts existing 'basic' records.

BEGIN;

--------------------------------------------------------------------------------
-- 1. Update handle_new_user function
--------------------------------------------------------------------------------
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

    -- 1. Create a default enterprise for the new user (Now using 'Básico')
    INSERT INTO public.empresas (nome, slug, plano)
    VALUES (
        user_nome || ' Enterprise',
        'emp-' || lower(regexp_replace(user_nome, '[^a-zA-Z0-9]', '', 'g')) || '-' || substr(new.id::text, 1, 8),
        'Básico'
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

--------------------------------------------------------------------------------
-- 2. Update debug_and_repair_user function
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.debug_and_repair_user(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_auth_exists BOOLEAN;
    v_public_exists BOOLEAN;
    v_empresa_id UUID;
    v_user_email TEXT;
    v_user_nome TEXT;
    result JSON;
BEGIN
    -- 1. Check if user exists in auth.users
    SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_auth_exists;
    
    -- 2. Check if user exists in public.usuarios
    SELECT EXISTS (SELECT 1 FROM public.usuarios WHERE id = p_user_id) INTO v_public_exists;
    
    IF NOT v_auth_exists THEN
        RETURN json_build_object(
            'status', 'error',
            'message', 'User does not exist in auth.users'
        );
    END IF;

    IF v_public_exists THEN
        RETURN json_build_object(
            'status', 'ok',
            'message', 'User already exists in public.usuarios'
        );
    END IF;

    -- 3. If missing from public, try to repair
    SELECT email, COALESCE(raw_user_meta_data->>'nome', split_part(email, '@', 1)) 
    INTO v_user_email, v_user_nome
    FROM auth.users WHERE id = p_user_id;

    -- Create empresa if not exists (or find one) - Now using 'Básico'
    INSERT INTO public.empresas (nome, slug, plano)
    VALUES (
        v_user_nome || ' Enterprise',
        'emp-' || lower(regexp_replace(v_user_nome, '[^a-zA-Z0-9]', '', 'g')) || '-' || substr(p_user_id::text, 1, 8),
        'Básico'
    )
    ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome 
    RETURNING id INTO v_empresa_id;

    -- Insert into usuarios
    INSERT INTO public.usuarios (id, empresa_id, nome, email, role)
    VALUES (p_user_id, v_empresa_id, v_user_nome, v_user_email, 'admin');

    RETURN json_build_object(
        'status', 'repaired',
        'message', 'User record created in public.usuarios',
        'empresa_id', v_empresa_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'status', 'error',
        'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

--------------------------------------------------------------------------------
-- 3. Backfill existing 'basic' records to 'Básico'
--------------------------------------------------------------------------------
UPDATE public.empresas SET plano = 'Básico' WHERE plano = 'basic';

COMMIT;
