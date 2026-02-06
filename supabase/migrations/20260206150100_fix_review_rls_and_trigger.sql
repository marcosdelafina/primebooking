-- Migration: Fix Review RLS and Trigger
-- Date: 2026-02-06
-- Description: Updates trigger to SECURITY DEFINER and adds auth_user_id for RLS author tracking.

BEGIN;

-- 1. Add auth_user_id to avaliacoes_empresa
ALTER TABLE public.avaliacoes_empresa ADD COLUMN IF NOT EXISTS auth_user_id UUID DEFAULT auth.uid();

-- 2. Fix update_business_rating to be SECURITY DEFINER
-- This allows the rating calculation to update the 'empresas' table even if the submitter (client) lacks permissions to that table.
CREATE OR REPLACE FUNCTION public.update_business_rating() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.empresas
    SET 
        rating = (
            SELECT COALESCE(AVG(nota)::numeric(2,1), 0)
            FROM public.avaliacoes_empresa
            WHERE empresa_id = COALESCE(NEW.empresa_id, OLD.empresa_id)
            AND status = 'active'
        ),
        avaliacoes = (
            SELECT COUNT(*)
            FROM public.avaliacoes_empresa
            WHERE empresa_id = COALESCE(NEW.empresa_id, OLD.empresa_id)
            AND status = 'active'
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.empresa_id, OLD.empresa_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Refine RLS Policies for avaliacoes_empresa
-- Clean up old overlapping policies
DROP POLICY IF EXISTS "public_insert_avaliacoes_empresa" ON public.avaliacoes_empresa;
DROP POLICY IF EXISTS "public_view_avaliacoes_empresa" ON public.avaliacoes_empresa;
DROP POLICY IF EXISTS "unified_access_avaliacoes_empresa" ON public.avaliacoes_empresa;
DROP POLICY IF EXISTS "Public can view active business reviews" ON public.avaliacoes_empresa;
DROP POLICY IF EXISTS "Business owners can view their business reviews" ON public.avaliacoes_empresa;
DROP POLICY IF EXISTS "Public can insert business reviews" ON public.avaliacoes_empresa;
DROP POLICY IF EXISTS "Business owners can moderate reviews" ON public.avaliacoes_empresa;
DROP POLICY IF EXISTS "Business owners can delete reviews" ON public.avaliacoes_empresa;

-- A. Insert: Anyone can insert if required fields are present
CREATE POLICY "public_insert_avaliacoes_empresa" ON public.avaliacoes_empresa 
FOR INSERT TO anon, authenticated 
WITH CHECK (
    empresa_id IS NOT NULL AND 
    nota >= 1 AND 
    nota <= 5 AND
    cliente_nome IS NOT NULL
);

-- B. Select: Authors and Business Admins can see reviews
CREATE POLICY "select_avaliacoes_empresa" ON public.avaliacoes_empresa
FOR SELECT TO anon, authenticated
USING (
    status = 'active' OR
    auth_user_id = (SELECT auth.uid()) OR
    empresa_id = public.get_my_company_id_optimized() OR
    public.is_admin_global_optimized()
);

-- C. All: Business Admins can manage their reviews
CREATE POLICY "admin_manage_avaliacoes_empresa" ON public.avaliacoes_empresa
FOR ALL TO authenticated
USING (
    empresa_id = public.get_my_company_id_optimized() OR
    public.is_admin_global_optimized()
);

COMMIT;
