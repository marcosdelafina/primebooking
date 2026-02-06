-- Migration: Relax Phone Unicity
-- Date: 2026-02-06
-- Description: Drops the unique index on telephone numbers to allow shared phones (families).

BEGIN;

-- 1. Drop the unique index on telefone
DROP INDEX IF EXISTS public.idx_clientes_global_unique_telefone;

-- Note: The email column already has a unique constraint from its creation in early migrations.
-- We keep (empresa_id, cliente_global_id) unique in clientes_empresa.

COMMIT;
