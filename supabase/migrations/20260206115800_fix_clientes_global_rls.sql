-- Migration: Fix Clientes Global RLS
-- Date: 2026-02-06
-- Description: Adds the UPDATE policy for clientes_global to allow admins to manage shared identities.

BEGIN;

-- 1. Add UPDATE policy for clientes_global
CREATE POLICY "Tenant link update - clientes_global" ON public.clientes_global
    FOR UPDATE USING (
        is_admin() OR
        EXISTS (
            SELECT 1 FROM public.clientes_empresa ce
            WHERE ce.cliente_global_id = public.clientes_global.id
            AND ce.empresa_id = get_my_company_id()
        )
    )
    WITH CHECK (
        is_admin() OR
        EXISTS (
            SELECT 1 FROM public.clientes_empresa ce
            WHERE ce.cliente_global_id = public.clientes_global.id
            AND ce.empresa_id = get_my_company_id()
        )
    );

COMMIT;
