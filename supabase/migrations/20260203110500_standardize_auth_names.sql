-- Standardize name extraction across all auth-related functions
-- This ensures that names coming from Google (full_name/name) or 
-- manual signup (nome) are all captured correctly.

-- 1. Update handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_empresa_id UUID;
    user_nome TEXT;
BEGIN
    -- Comprehensive name extraction
    user_nome := COALESCE(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        new.raw_user_meta_data->>'nome',
        split_part(new.email, '@', 1)
    );
    
    INSERT INTO public.empresas (nome, slug, plano)
    VALUES (
        user_nome || ' Enterprise',
        'emp-' || lower(regexp_replace(user_nome, '[^a-zA-Z0-9]', '', 'g')) || '-' || substr(new.id::text, 1, 8),
        'basic'
    )
    RETURNING id INTO new_empresa_id;

    INSERT INTO public.usuarios (id, empresa_id, nome, email, role)
    VALUES (
        new.id,
        new_empresa_id,
        user_nome,
        new.email,
        'admin'
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. Update debug_and_repair_user logic
CREATE OR REPLACE FUNCTION public.debug_and_repair_user(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_auth_exists BOOLEAN;
    v_public_exists BOOLEAN;
    v_empresa_id UUID;
    v_user_email TEXT;
    v_user_nome TEXT;
BEGIN
    SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_auth_exists;
    SELECT EXISTS (SELECT 1 FROM public.usuarios WHERE id = p_user_id) INTO v_public_exists;
    
    IF NOT v_auth_exists THEN
        RETURN json_build_object('status', 'error', 'message', 'User not in auth.users');
    END IF;

    IF v_public_exists THEN
        RETURN json_build_object('status', 'ok', 'message', 'User already synced');
    END IF;

    -- Improved extraction for repair
    SELECT 
        email, 
        COALESCE(
            raw_user_meta_data->>'full_name',
            raw_user_meta_data->>'name',
            raw_user_meta_data->>'nome', 
            split_part(email, '@', 1)
        ) 
    INTO v_user_email, v_user_nome
    FROM auth.users WHERE id = p_user_id;

    INSERT INTO public.empresas (nome, slug, plano)
    VALUES (
        v_user_nome || ' Enterprise',
        'emp-' || lower(regexp_replace(v_user_nome, '[^a-zA-Z0-9]', '', 'g')) || '-' || substr(p_user_id::text, 1, 8),
        'basic'
    )
    ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome 
    RETURNING id INTO v_empresa_id;

    INSERT INTO public.usuarios (id, empresa_id, nome, email, role)
    VALUES (p_user_id, v_empresa_id, v_user_nome, v_user_email, 'admin');

    RETURN json_build_object('status', 'repaired', 'message', 'User synced', 'empresa_id', v_empresa_id);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('status', 'error', 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
