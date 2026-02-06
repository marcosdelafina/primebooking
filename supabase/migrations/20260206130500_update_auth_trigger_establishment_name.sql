-- Migration: Update Global Signup Trigger for Establishment Name
-- Date: 2026-02-06
-- Description: Updates the handle_new_user trigger to use nome_estabelecimento from metadata.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_empresa_id UUID;
    user_nome TEXT;
    estab_nome TEXT;
    base_slug TEXT;
BEGIN
    -- Extract name from metadata or use email prefix
    user_nome := COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1));
    
    -- Extract establishment name from metadata
    estab_nome := COALESCE(new.raw_user_meta_data->>'nome_estabelecimento', user_nome || ' Enterprise');

    -- Generate a clean slug
    base_slug := lower(regexp_replace(estab_nome, '[^a-zA-Z0-9]', '', 'g'));
    IF base_slug = '' THEN base_slug := 'emp'; END IF;

    -- 1. Create a default enterprise for the new user
    INSERT INTO public.empresas (nome, slug, plano)
    VALUES (
        estab_nome,
        base_slug || '-' || substr(new.id::text, 1, 8),
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

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
