-- Migration: Add telefone to profissionais
-- Date: 2026-02-01

ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS telefone TEXT;
