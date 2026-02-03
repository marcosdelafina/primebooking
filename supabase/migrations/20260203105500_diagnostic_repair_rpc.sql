-- Diagnostic and Repair RPC
-- Use this to check why a user might be missing from public.usuarios and fix it.

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

    -- Create empresa if not exists (or find one)
    INSERT INTO public.empresas (nome, slug, plano)
    VALUES (
        v_user_nome || ' Enterprise',
        'emp-' || lower(regexp_replace(v_user_nome, '[^a-zA-Z0-9]', '', 'g')) || '-' || substr(p_user_id::text, 1, 8),
        'basic'
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
