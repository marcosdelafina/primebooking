-- Migration: Fix RLS and Refine Auth Trigger
-- Date: 2026-02-06
-- Description: Adds INSERT policy for anon on agendamentos and makes handle_new_user more robust.

BEGIN;

-- 1. Fix RLS on agendamentos (Allow public booking)
DROP POLICY IF EXISTS "public_insert_agendamentos" ON public.agendamentos;
CREATE POLICY "public_insert_agendamentos" ON public.agendamentos
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- 2. Refine handle_new_user to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_empresa_id UUID;
    user_nome TEXT;
    v_is_client BOOLEAN;
BEGIN
    -- Extract info from metadata
    user_nome := COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1));
    
    -- Robust boolean check: handles boolean true, string 'true', and missing key
    v_is_client := (
        COALESCE(new.raw_user_meta_data->>'is_client', 'false') = 'true' 
        OR (new.raw_user_meta_data->'is_client')::jsonb = 'true'::jsonb
    );

    -- If the user is a client, just return and do nothing here.
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
