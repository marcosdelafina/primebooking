-- Migration: Fix auth trigger to prevent company creation for clients
-- Date: 2026-02-06
-- Description: Updates handle_new_user to check for 'is_client' in user metadata and skip enterprise/staff creation for clients.

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_empresa_id UUID;
    user_nome TEXT;
    v_is_client BOOLEAN;
BEGIN
    -- Extract info from metadata
    user_nome := COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1));
    v_is_client := (new.raw_user_meta_data->>'is_client')::BOOLEAN;

    -- If the user is a client, just return and do nothing here.
    -- (The handle-client-registration edge function handles their profile)
    IF v_is_client IS TRUE THEN
        RETURN new;
    END IF;

    -- 1. Create a default enterprise for the new user (Business Owner flow)
    INSERT INTO public.empresas (nome, slug, plano)
    VALUES (
        user_nome || ' Enterprise',
        'emp-' || lower(regexp_replace(user_nome, '[^a-zA-Z0-9]', '', 'g')) || '-' || substr(new.id::text, 1, 8),
        'basic'
    )
    RETURNING id INTO new_empresa_id;

    -- 2. Insert the user into our public.usuarios table (Staff user)
    INSERT INTO public.usuarios (id, empresa_id, nome, email, role)
    VALUES (
        new.id,
        new_empresa_id,
        user_nome,
        new.email,
        'admin' -- First user is the admin/owner
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
