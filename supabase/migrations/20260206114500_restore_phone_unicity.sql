-- Migration: Restore Phone Unicity
-- Date: 2026-02-06
-- Description: Re-creates the unique index on telephone numbers to ensure global identity consistency.

BEGIN;

-- 1. Re-create the unique index on telefone (ignoring NULLs)
-- This will fail if there are already duplicates. 
-- Given the short time since the relax migration, we expect either zero or very few duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_global_unique_telefone ON public.clientes_global (telefone) WHERE telefone IS NOT NULL;

COMMIT;
