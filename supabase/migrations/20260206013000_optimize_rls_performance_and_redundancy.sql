-- Migration: Optimize RLS Performance and Redundancy
-- Description: Wraps auth.uid() in subqueries, consolidates permissive policies, and hardens security.

BEGIN;

--------------------------------------------------------------------------------
-- 1. Optimized Security Functions
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_company_id_optimized() 
RETURNS UUID AS $$
    SELECT empresa_id FROM public.usuarios WHERE id = (SELECT auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin_global_optimized() 
RETURNS BOOLEAN AS $$
    SELECT COALESCE(is_admin_global, false) FROM public.usuarios WHERE id = (SELECT auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

--------------------------------------------------------------------------------
-- 2. Clean up old policies (to avoid redundancy)
--------------------------------------------------------------------------------
-- agendamentos
DROP POLICY IF EXISTS "Global Admins bypass - agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Tenant isolation - agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Optimized access - agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "unified_access_agendamentos" ON public.agendamentos;

-- empresas
DROP POLICY IF EXISTS "Global Admins bypass - empresas" ON public.empresas;
DROP POLICY IF EXISTS "Tenant isolation - empresas" ON public.empresas;
DROP POLICY IF EXISTS "Public companies directory" ON public.empresas;
DROP POLICY IF EXISTS "Optimized access - empresas" ON public.empresas;
DROP POLICY IF EXISTS "Public read - empresas" ON public.empresas;
DROP POLICY IF EXISTS "public_view_empresas" ON public.empresas;
DROP POLICY IF EXISTS "unified_access_empresas" ON public.empresas;

-- usuarios
DROP POLICY IF EXISTS "Global Admins bypass - usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_read_policy" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_policy" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_delete_policy" ON public.usuarios;
DROP POLICY IF EXISTS "Optimized access - usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "unified_access_usuarios" ON public.usuarios;

-- plataforma_avaliacoes
DROP POLICY IF EXISTS "Public can view active reviews" ON public.plataforma_avaliacoes;
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.plataforma_avaliacoes;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.plataforma_avaliacoes;
DROP POLICY IF EXISTS "Global Admin can manage reviews" ON public.plataforma_avaliacoes;
DROP POLICY IF EXISTS "Global Admin can delete reviews" ON public.plataforma_avaliacoes;
DROP POLICY IF EXISTS "unified_access_plataforma_avaliacoes" ON public.plataforma_avaliacoes;
DROP POLICY IF EXISTS "public_view_plataforma_avaliacoes" ON public.plataforma_avaliacoes;

-- avaliacoes_empresa
DROP POLICY IF EXISTS "Public can view active business reviews" ON public.avaliacoes_empresa;
DROP POLICY IF EXISTS "Business owners can view their business reviews" ON public.avaliacoes_empresa;
DROP POLICY IF EXISTS "Public can insert business reviews" ON public.avaliacoes_empresa;
DROP POLICY IF EXISTS "Business owners can moderate reviews" ON public.avaliacoes_empresa;
DROP POLICY IF EXISTS "Business owners can delete reviews" ON public.avaliacoes_empresa;
DROP POLICY IF EXISTS "unified_access_avaliacoes_empresa" ON public.avaliacoes_empresa;
DROP POLICY IF EXISTS "public_insert_avaliacoes_empresa" ON public.avaliacoes_empresa;
DROP POLICY IF EXISTS "public_view_avaliacoes_empresa" ON public.avaliacoes_empresa;

-- profissionais
DROP POLICY IF EXISTS "Global Admins bypass - profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "Public professionals by company" ON public.profissionais;
DROP POLICY IF EXISTS "Tenant isolation - profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "unified_access_profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "public_view_profissionais" ON public.profissionais;

-- servicos
DROP POLICY IF EXISTS "Global Admins bypass - servicos" ON public.servicos;
DROP POLICY IF EXISTS "Public services by company" ON public.servicos;
DROP POLICY IF EXISTS "Tenant isolation - servicos" ON public.servicos;
DROP POLICY IF EXISTS "unified_access_servicos" ON public.servicos;
DROP POLICY IF EXISTS "public_view_servicos" ON public.servicos;

-- conversas
DROP POLICY IF EXISTS "Global Admins bypass - conversas" ON public.conversas;
DROP POLICY IF EXISTS "Tenant isolation - conversas" ON public.conversas;
DROP POLICY IF EXISTS "unified_access_conversas" ON public.conversas;

-- email_events
DROP POLICY IF EXISTS "Company Admins view their email events" ON public.email_events;
DROP POLICY IF EXISTS "Global Admins view all email events" ON public.email_events;
DROP POLICY IF EXISTS "unified_access_email_events" ON public.email_events;

-- billing_empresa
DROP POLICY IF EXISTS "Company admins view own billing" ON public.billing_empresa;
DROP POLICY IF EXISTS "Global Admins view all billing" ON public.billing_empresa;
DROP POLICY IF EXISTS "Public view billing status" ON public.billing_empresa;
DROP POLICY IF EXISTS "unified_access_billing_empresa" ON public.billing_empresa;
DROP POLICY IF EXISTS "public_view_billing_empresa" ON public.billing_empresa;

-- categorias_empresa
DROP POLICY IF EXISTS "Allow global admins to manage categories" ON public.categorias_empresa;
DROP POLICY IF EXISTS "Allow public read-only access to categories" ON public.categorias_empresa;
DROP POLICY IF EXISTS "unified_access_categorias_empresa" ON public.categorias_empresa;
DROP POLICY IF EXISTS "public_view_categorias_empresa" ON public.categorias_empresa;

-- plano_valores
DROP POLICY IF EXISTS "Global Admins manage plan pricing" ON public.plano_valores;
DROP POLICY IF EXISTS "Public view plan pricing" ON public.plano_valores;
DROP POLICY IF EXISTS "unified_access_plano_valores" ON public.plano_valores;
DROP POLICY IF EXISTS "public_view_plano_valores" ON public.plano_valores;

-- planos
DROP POLICY IF EXISTS "Global Admins manage plans" ON public.planos;
DROP POLICY IF EXISTS "Public view active plans" ON public.planos;
DROP POLICY IF EXISTS "unified_access_planos" ON public.planos;
DROP POLICY IF EXISTS "public_view_planos" ON public.planos;

-- subscription_invoices
DROP POLICY IF EXISTS "Company users view own invoices" ON public.subscription_invoices;
DROP POLICY IF EXISTS "Global Admins view all invoices" ON public.subscription_invoices;
DROP POLICY IF EXISTS "unified_access_subscription_invoices" ON public.subscription_invoices;

--------------------------------------------------------------------------------
-- 3. Implement Optimized Unified Policies
--------------------------------------------------------------------------------

-- agendamentos
CREATE POLICY "unified_access_agendamentos" ON public.agendamentos FOR ALL TO authenticated
USING (empresa_id = public.get_my_company_id_optimized() OR public.is_admin_global_optimized());

-- empresas
CREATE POLICY "unified_access_empresas" ON public.empresas FOR ALL TO authenticated
USING (id = public.get_my_company_id_optimized() OR public.is_admin_global_optimized());
CREATE POLICY "public_view_empresas" ON public.empresas FOR SELECT TO anon, authenticated
USING (true);

-- usuarios
CREATE POLICY "unified_access_usuarios" ON public.usuarios FOR ALL TO authenticated
USING (id = (SELECT auth.uid()) OR empresa_id = public.get_my_company_id_optimized() OR public.is_admin_global_optimized());

-- plataforma_avaliacoes
CREATE POLICY "unified_access_plataforma_avaliacoes" ON public.plataforma_avaliacoes FOR ALL TO authenticated
USING (usuario_id = (SELECT auth.uid()) OR public.is_admin_global_optimized());
CREATE POLICY "public_view_plataforma_avaliacoes" ON public.plataforma_avaliacoes FOR SELECT TO anon, authenticated
USING (status = 'active');

-- avaliacoes_empresa
CREATE POLICY "unified_access_avaliacoes_empresa" ON public.avaliacoes_empresa FOR ALL TO authenticated
USING (empresa_id = public.get_my_company_id_optimized() OR public.is_admin_global_optimized());
CREATE POLICY "public_insert_avaliacoes_empresa" ON public.avaliacoes_empresa FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_view_avaliacoes_empresa" ON public.avaliacoes_empresa FOR SELECT TO anon, authenticated USING (status = 'active');

-- profissionais
CREATE POLICY "unified_access_profissionais" ON public.profissionais FOR ALL TO authenticated
USING (empresa_id = public.get_my_company_id_optimized() OR public.is_admin_global_optimized());
CREATE POLICY "public_view_profissionais" ON public.profissionais FOR SELECT TO anon, authenticated USING (true);

-- servicos
CREATE POLICY "unified_access_servicos" ON public.servicos FOR ALL TO authenticated
USING (empresa_id = public.get_my_company_id_optimized() OR public.is_admin_global_optimized());
CREATE POLICY "public_view_servicos" ON public.servicos FOR SELECT TO anon, authenticated USING (ativo = true);

-- conversas
CREATE POLICY "unified_access_conversas" ON public.conversas FOR ALL TO authenticated
USING (empresa_id = public.get_my_company_id_optimized() OR public.is_admin_global_optimized());

-- email_events
CREATE POLICY "unified_access_email_events" ON public.email_events FOR ALL TO authenticated
USING (company_id = public.get_my_company_id_optimized() OR public.is_admin_global_optimized());

-- billing_empresa
CREATE POLICY "unified_access_billing_empresa" ON public.billing_empresa FOR ALL TO authenticated
USING (empresa_id = public.get_my_company_id_optimized() OR public.is_admin_global_optimized());
CREATE POLICY "public_view_billing_empresa" ON public.billing_empresa FOR SELECT TO anon, authenticated USING (true);

-- categorias_empresa
CREATE POLICY "unified_access_categorias_empresa" ON public.categorias_empresa FOR ALL TO authenticated
USING (public.is_admin_global_optimized());
CREATE POLICY "public_view_categorias_empresa" ON public.categorias_empresa FOR SELECT TO anon, authenticated USING (true);

-- plano_valores
CREATE POLICY "unified_access_plano_valores" ON public.plano_valores FOR ALL TO authenticated
USING (public.is_admin_global_optimized());
CREATE POLICY "public_view_plano_valores" ON public.plano_valores FOR SELECT TO anon, authenticated USING (true);

-- planos
CREATE POLICY "unified_access_planos" ON public.planos FOR ALL TO authenticated
USING (public.is_admin_global_optimized());
CREATE POLICY "public_view_planos" ON public.planos FOR SELECT TO anon, authenticated USING (true);

-- subscription_invoices
CREATE POLICY "unified_access_subscription_invoices" ON public.subscription_invoices FOR ALL TO authenticated
USING (
  empresa_id = public.get_my_company_id_optimized() 
  OR public.is_admin_global_optimized()
);

COMMIT;
