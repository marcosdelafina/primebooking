-- Migration: Plan Management Schema (RF-PLN-001 & RF-PLN-002)
-- Date: 2026-02-03
-- Description: Adds tables for logical plans and versioned pricing with validity periods.

BEGIN;

--------------------------------------------------------------------------------
-- 1. Create planos table (RF-PLN-001)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.planos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT,
    type TEXT NOT NULL DEFAULT 'assinatura',
    max_usuarios INTEGER DEFAULT 999,
    features JSONB DEFAULT '[]'::jsonb,
    is_draft BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- 2. Create plano_valores table (RF-PLN-002)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plano_valores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plano_id UUID NOT NULL REFERENCES public.planos(id) ON DELETE CASCADE,
    valor_mensal NUMERIC(12,2) NOT NULL DEFAULT 0,
    valor_anual NUMERIC(12,2) NOT NULL DEFAULT 0,
    data_inicio_vigencia DATE NOT NULL,
    data_fim_vigencia DATE, -- NULL means until further notice
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.plano_valores ENABLE ROW LEVEL SECURITY;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_plano_valores_plano_id ON public.plano_valores(plano_id);
CREATE INDEX IF NOT EXISTS idx_plano_valores_vigencia ON public.plano_valores(data_inicio_vigencia, data_fim_vigencia);

--------------------------------------------------------------------------------
-- 3. Overlap Prevention logic (RF-PLN-002 Regras)
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_check_plano_valores_overlap
    BEFORE INSERT OR UPDATE ON public.plano_valores
    FOR EACH ROW EXECUTE FUNCTION public.check_plano_valores_overlap();

--------------------------------------------------------------------------------
-- 4. Helper Function: Get Current Plan Price (RF-PLN-004)
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_current_plan_price(p_plano_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    valor_mensal NUMERIC(12,2),
    valor_anual NUMERIC(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT pv.valor_mensal, pv.valor_anual
    FROM public.plano_valores pv
    WHERE pv.plano_id = p_plano_id
      AND p_date >= pv.data_inicio_vigencia
      AND (pv.data_fim_vigencia IS NULL OR p_date <= pv.data_fim_vigencia)
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

--------------------------------------------------------------------------------
-- 5. RLS Policies (RF-PLN-005)
--------------------------------------------------------------------------------

-- Planos: Everyone can view, only Global Admin can modify
CREATE POLICY "Public view active plans" ON public.planos 
    FOR SELECT USING (NOT is_draft OR public.is_admin());

CREATE POLICY "Global Admins manage plans" ON public.planos
    FOR ALL USING (public.is_admin());

-- Plano Valores: Everyone can view, only Global Admin can modify
CREATE POLICY "Public view plan pricing" ON public.plano_valores
    FOR SELECT USING (true);

CREATE POLICY "Global Admins manage plan pricing" ON public.plano_valores
    FOR ALL USING (public.is_admin());

--------------------------------------------------------------------------------
-- 6. Initial Seed: Basic Plan
--------------------------------------------------------------------------------

DO $$
DECLARE
    v_basic_id UUID;
BEGIN
    -- 1. Insert Basic Plan
    INSERT INTO public.planos (nome, descricao, type, max_usuarios, features)
    VALUES ('Básico', 'Plano ideal para pequenos negócios e profissionais liberais.', 'assinatura', 2, '["Agendamentos ilimitados", "1 Profissional", "Notificações via e-mail"]')
    ON CONFLICT (nome) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_basic_id;

    -- 2. Insert Initial Price (R$ 39,90)
    INSERT INTO public.plano_valores (plano_id, valor_mensal, valor_anual, data_inicio_vigencia)
    VALUES (v_basic_id, 39.90, 399.00, '2026-01-01')
    ON CONFLICT DO NOTHING;
END $$;

COMMIT;
