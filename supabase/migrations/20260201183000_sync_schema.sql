-- Migration: Sync schema with frontend entities
-- Date: 2026-02-01

-- 1. Servicos
ALTER TABLE public.servicos ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE public.servicos ADD COLUMN IF NOT EXISTS imagem_url TEXT;

-- 2. Profissionais
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
-- Use UUID[] for servicos_ids for better performance and typing
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS servicos_ids UUID[] DEFAULT '{}'::uuid[];

-- 3. Clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS notas TEXT;

-- 4. Agendamentos
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger for updated_at in agendamentos
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS tr_agendamentos_updated_at ON public.agendamentos;
CREATE TRIGGER tr_agendamentos_updated_at
    BEFORE UPDATE ON public.agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
