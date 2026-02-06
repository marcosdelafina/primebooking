-- Hardening Database Security
-- Addresses Supabase Database Linter warnings (search_path & RLS)

-- 1. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- 2. handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = '';

-- 3. update_business_rating
CREATE OR REPLACE FUNCTION public.update_business_rating() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.empresas
    SET 
        rating = (
            SELECT COALESCE(AVG(nota)::numeric(2,1), 0)
            FROM public.avaliacoes_empresa
            WHERE empresa_id = COALESCE(NEW.empresa_id, OLD.empresa_id)
            AND status = 'active'
        ),
        avaliacoes = (
            SELECT COUNT(*)
            FROM public.avaliacoes_empresa
            WHERE empresa_id = COALESCE(NEW.empresa_id, OLD.empresa_id)
            AND status = 'active'
        )
    WHERE id = COALESCE(NEW.empresa_id, OLD.empresa_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_empresa_id UUID;
    user_nome TEXT;
BEGIN
    user_nome := COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1));
    
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. increment_global_likes
CREATE OR REPLACE FUNCTION public.increment_global_likes(p_session_id TEXT)
RETURNS BIGINT AS $$
DECLARE
    v_total BIGINT;
BEGIN
    IF EXISTS (SELECT 1 FROM public.likes_events WHERE session_id = p_session_id AND target_id = 'global') THEN
        SELECT total_likes INTO v_total FROM public.likes_counter WHERE id = 'global';
        RETURN COALESCE(v_total, 0);
    END IF;

    INSERT INTO public.likes_events (session_id, target_id) VALUES (p_session_id, 'global')
    ON CONFLICT (session_id, target_id) DO NOTHING;

    UPDATE public.likes_counter 
    SET total_likes = total_likes + 1, updated_at = now()
    WHERE id = 'global'
    RETURNING total_likes INTO v_total;

    RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. increment_likes
CREATE OR REPLACE FUNCTION public.increment_likes(p_target_id TEXT, p_session_id TEXT)
RETURNS BIGINT AS $$
DECLARE
    v_total BIGINT;
BEGIN
    IF EXISTS (SELECT 1 FROM public.likes_events WHERE session_id = p_session_id AND target_id = p_target_id) THEN
        SELECT total_likes INTO v_total FROM public.likes_counter WHERE id = p_target_id;
        RETURN COALESCE(v_total, 0);
    END IF;

    INSERT INTO public.likes_counter (id, total_likes)
    VALUES (p_target_id, 0)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.likes_events (session_id, target_id) VALUES (p_session_id, p_target_id)
    ON CONFLICT (session_id, target_id) DO NOTHING;

    UPDATE public.likes_counter 
    SET total_likes = total_likes + 1, updated_at = now()
    WHERE id = p_target_id
    RETURNING total_likes INTO v_total;

    RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 7. RLS Hardening for avaliacoes_empresa
DROP POLICY IF EXISTS "Public can insert business reviews" ON avaliacoes_empresa;
CREATE POLICY "Public can insert business reviews"
ON public.avaliacoes_empresa FOR INSERT
WITH CHECK (
    empresa_id IS NOT NULL AND 
    nota >= 1 AND 
    nota <= 5 AND
    cliente_nome IS NOT NULL
);
