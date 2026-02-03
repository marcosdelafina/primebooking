-- Migration: Security Hardening - Fix Mutable Search Path
-- Date: 2026-02-03
-- Description: Adds SET search_path = public to functions to resolve Supabase lint errors and improve security.

BEGIN;

--------------------------------------------------------------------------------
-- 1. Fix check_plano_valores_overlap
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_plano_valores_overlap()
RETURNS TRIGGER AS $$
DECLARE
    overlap_count INTEGER;
BEGIN
    -- Check for overlapping periods for the same plan
    SELECT COUNT(*) INTO overlap_count
    FROM public.plano_valores
    WHERE plano_id = NEW.plano_id
      AND id != NEW.id
      AND (
          (NEW.data_fim_vigencia IS NULL AND (data_fim_vigencia IS NULL OR data_fim_vigencia >= NEW.data_inicio_vigencia))
          OR
          (NEW.data_fim_vigencia IS NOT NULL AND (
              (data_fim_vigencia IS NULL AND data_inicio_vigencia <= NEW.data_fim_vigencia)
              OR
              (data_inicio_vigencia <= NEW.data_fim_vigencia AND COALESCE(data_fim_vigencia, '9999-12-31') >= NEW.data_inicio_vigencia)
          ))
      );

    IF overlap_count > 0 THEN
        RAISE EXCEPTION 'Sobreposição de vigência detectada para este plano.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

--------------------------------------------------------------------------------
-- 2. Ensure handle_new_user uses public search_path
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

    -- 1. Create a default enterprise for the new user
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
        -- Call is now safe since search_path includes public
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
