-- Migration: Global Clients Structure
-- Date: 2026-02-06
-- Description: Splits clientes into clientes_global (identity) and clientes_empresa (link/tenant data).

BEGIN;

--------------------------------------------------------------------------------
-- 1. Create clientes_global table (Central Identity)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clientes_global (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL UNIQUE,
    nome TEXT,
    telefone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for email lookup
CREATE INDEX IF NOT EXISTS idx_clientes_global_email ON public.clientes_global(email);

--------------------------------------------------------------------------------
-- 2. Data Migration: Populate clientes_global
--------------------------------------------------------------------------------
INSERT INTO public.clientes_global (email, nome, telefone, created_at)
SELECT DISTINCT ON (email) email, nome, telefone, created_at
FROM public.clientes
WHERE email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

--------------------------------------------------------------------------------
-- 3. Refactor public.clientes into public.clientes_empresa
--------------------------------------------------------------------------------

-- Add the link column
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cliente_global_id UUID REFERENCES public.clientes_global(id) ON DELETE CASCADE;

-- Update the link column based on email
UPDATE public.clientes c
SET cliente_global_id = cg.id
FROM public.clientes_global cg
WHERE c.email = cg.email;

-- Rename the table
ALTER TABLE public.clientes RENAME TO clientes_empresa;

-- Add unique constraint (one link per client per company)
-- We might have duplicates if the old table had multiple rows for the same email/company
-- Let's clean up or allow migration to fail if duplicates exist (safer for data integrity)
ALTER TABLE public.clientes_empresa ADD CONSTRAINT unique_empresa_cliente_global UNIQUE (empresa_id, cliente_global_id);

-- Rename primary key index if desired (standardization)
ALTER INDEX IF EXISTS public.clientes_pkey RENAME TO clientes_empresa_pkey;
ALTER INDEX IF EXISTS public.idx_clientes_empresa_id RENAME TO idx_clientes_empresa_tenant;

--------------------------------------------------------------------------------
-- 4. Security & RLS
--------------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE public.clientes_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_empresa ENABLE ROW LEVEL SECURITY;

-- Create/Update Policies for clientes_empresa
-- Drop old ones that might have been on 'clientes'
DROP POLICY IF EXISTS "Tenant isolation - clientes" ON public.clientes_empresa;
DROP POLICY IF EXISTS "Global Admins bypass - clientes" ON public.clientes_empresa;

CREATE POLICY "Tenant isolation - clientes_empresa" ON public.clientes_empresa
    FOR ALL USING (is_admin() OR empresa_id = get_my_company_id());

-- Policies for clientes_global
-- Tenants can only see global clients they have a link to
CREATE POLICY "Tenant link - clientes_global" ON public.clientes_global
    FOR SELECT USING (
        is_admin() OR
        EXISTS (
            SELECT 1 FROM public.clientes_empresa ce
            WHERE ce.cliente_global_id = public.clientes_global.id
            AND ce.empresa_id = get_my_company_id()
        )
    );

COMMIT;
