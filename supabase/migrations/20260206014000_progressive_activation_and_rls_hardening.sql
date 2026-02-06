-- Migration: Progressive Activation & RLS Hardening
-- Date: 2026-02-06
-- Description: Makes email nullable in clientes_global, adds unique constraint on telefone, and fixes permissive INSERT policy on avaliacoes_empresa.

BEGIN;

--------------------------------------------------------------------------------
-- 1. RLS Hardening: Fix permissive INSERT on avaliacoes_empresa
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "public_insert_avaliacoes_empresa" ON public.avaliacoes_empresa;

CREATE POLICY "public_insert_avaliacoes_empresa" ON public.avaliacoes_empresa 
FOR INSERT TO anon, authenticated 
WITH CHECK (
    nota >= 1 AND 
    nota <= 5 AND 
    empresa_id IS NOT NULL
);

--------------------------------------------------------------------------------
-- 2. Schema Adjustment: clientes_global for Progressive Activation
--------------------------------------------------------------------------------

-- Make email nullable
ALTER TABLE public.clientes_global ALTER COLUMN email DROP NOT NULL;

-- Ensure telefone is unique globally (if provided)
-- We might need to handle existing duplicates first if any exist
-- For safety, we will create a unique index that ignores NULLs
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_global_unique_telefone ON public.clientes_global (telefone) WHERE telefone IS NOT NULL;

--------------------------------------------------------------------------------
-- 3. Update clientes_empresa linking logic if needed
--------------------------------------------------------------------------------
-- Ensure the link table is solid
-- Currently: ALTER TABLE public.clientes_empresa ADD CONSTRAINT unique_empresa_cliente_global UNIQUE (empresa_id, cliente_global_id);
-- (This was done in 20260206010500)

COMMIT;
