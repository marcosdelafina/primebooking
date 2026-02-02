-- Migration: Global Admin and Simplified Billing
-- Date: 2026-02-02
-- Description: Adds is_admin_global to usuarios and creates billing_empresa table.

BEGIN;

--------------------------------------------------------------------------------
-- 1. Update usuarios table
--------------------------------------------------------------------------------
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS is_admin_global BOOLEAN DEFAULT FALSE;

--------------------------------------------------------------------------------
-- 2. Create billing_empresa table
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    valor_mensal NUMERIC(12,2) NOT NULL DEFAULT 0,
    billing_status TEXT NOT NULL DEFAULT 'ATIVA' CHECK (billing_status IN ('ATIVA', 'INADIMPLENTE', 'SUSPENSA')),
    ciclo_atual TEXT, -- Format: YYYY-MM
    data_renovacao TIMESTAMPTZ,
    data_onboarding TIMESTAMPTZ DEFAULT NOW(),
    data_inicio_ciclo TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.billing_empresa ENABLE ROW LEVEL SECURITY;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_billing_empresa_empresa_id ON public.billing_empresa(empresa_id);

--------------------------------------------------------------------------------
-- 3. Security Helpers & RLS Update
--------------------------------------------------------------------------------

-- Helper function to check if a user is a global admin
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
    SELECT COALESCE(is_admin_global, false) FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Update RLS policies to allow global admin access (bypass tenant isolation)
-- We need to DROP and CREATE because adding OR to existing policies is safer this way

-- Empresas
DROP POLICY IF EXISTS "Tenant isolation - empresas" ON public.empresas;
CREATE POLICY "Tenant isolation - empresas" ON public.empresas
    FOR ALL USING (is_admin() OR id = get_my_company_id());

-- Usuarios
DROP POLICY IF EXISTS "Tenant isolation - usuarios" ON public.usuarios;
CREATE POLICY "Tenant isolation - usuarios" ON public.usuarios
    FOR ALL USING (is_admin() OR empresa_id = get_my_company_id());

-- Clientes
DROP POLICY IF EXISTS "Tenant isolation - clientes" ON public.clientes;
CREATE POLICY "Tenant isolation - clientes" ON public.clientes
    FOR ALL USING (is_admin() OR empresa_id = get_my_company_id());

-- Servicos
DROP POLICY IF EXISTS "Tenant isolation - servicos" ON public.servicos;
CREATE POLICY "Tenant isolation - servicos" ON public.servicos
    FOR ALL USING (is_admin() OR empresa_id = get_my_company_id());

-- Profissionais
DROP POLICY IF EXISTS "Tenant isolation - profissionais" ON public.profissionais;
CREATE POLICY "Tenant isolation - profissionais" ON public.profissionais
    FOR ALL USING (is_admin() OR empresa_id = get_my_company_id());

-- Agendamentos
DROP POLICY IF EXISTS "Tenant isolation - agendamentos" ON public.agendamentos;
CREATE POLICY "Tenant isolation - agendamentos" ON public.agendamentos
    FOR ALL USING (is_admin() OR empresa_id = get_my_company_id());

-- Conversas
DROP POLICY IF EXISTS "Tenant isolation - conversas" ON public.conversas;
CREATE POLICY "Tenant isolation - conversas" ON public.conversas
    FOR ALL USING (is_admin() OR empresa_id = get_my_company_id());

-- Billing Empresa Policies
CREATE POLICY "Global Admins view all billing" ON public.billing_empresa
    FOR ALL USING (is_admin());

CREATE POLICY "Company admins view own billing" ON public.billing_empresa
    FOR SELECT USING (empresa_id = get_my_company_id());

COMMIT;
