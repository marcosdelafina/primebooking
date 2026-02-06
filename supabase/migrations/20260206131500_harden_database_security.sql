-- Migration: Harden Database Security (Linter Fixes)
-- Date: 2026-02-06
-- Description: Sets explicit search_path for sync functions and tightens agendamentos RLS.

BEGIN;

-- 1. Fix Search Path for sync functions (Security Linter 0011)
ALTER FUNCTION public.fn_sync_global_client_to_empresa() SET search_path = public;
ALTER FUNCTION public.fn_populate_empresa_client_from_global() SET search_path = public;

-- 2. Tighten RLS Policy for agendamentos (Security Linter 0024)
-- The original policy used WITH CHECK (true), which is too permissive.
-- We'll restrict it to ensure a valid empresa_id is provided.
DROP POLICY IF EXISTS "public_insert_agendamentos" ON public.agendamentos;
CREATE POLICY "public_insert_agendamentos" ON public.agendamentos
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        empresa_id IS NOT NULL AND 
        EXISTS (SELECT 1 FROM public.empresas WHERE id = empresa_id)
    );

COMMIT;
