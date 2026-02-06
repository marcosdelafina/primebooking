-- Migration: Clean Establishment Slugs
-- Date: 2026-02-06
-- Description: Updates handle_new_user and debug_and_repair_user to prefer clean slugs, only adding suffixes on collision.

BEGIN;

-- 1. Update handle_new_user with clean slug logic
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

    -- Create enterprise
    INSERT INTO public.empresas (nome, slug, plano)
    VALUES (estab_nome, final_slug, 'Básico')
    RETURNING id INTO new_empresa_id;

    -- Insert the user
    INSERT INTO public.usuarios (id, empresa_id, nome, email, role)
    VALUES (new.id, new_empresa_id, user_nome, new.email, 'admin');

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Update debug_and_repair_user with clean slug logic
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
    SELECT EXISTS (SELECT 1 FROM public.usuarios WHERE id = p_user_id) INTO v_public_exists;
    
    IF v_public_exists THEN
        RETURN json_build_object('status', 'ok', 'message', 'User already exists in public.usuarios');
    END IF;

    -- 3. Repair logic
    v_base_slug := lower(regexp_replace(v_user_nome, '[^a-zA-Z0-9]', '', 'g'));
    IF v_base_slug = '' THEN v_base_slug := 'emp'; END IF;

    -- Check for collision
    IF EXISTS (SELECT 1 FROM public.empresas WHERE slug = v_base_slug) THEN
        v_final_slug := v_base_slug || '-' || substr(p_user_id::text, 1, 8);
    ELSE
        v_final_slug := v_base_slug;
    END IF;

    -- Create empresa
    INSERT INTO public.empresas (nome, slug, plano)
    VALUES (v_user_nome || ' Enterprise', v_final_slug, 'Básico')
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
    RETURN json_build_object('status', 'error', 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
