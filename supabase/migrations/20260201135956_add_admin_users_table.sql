-- Table: admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Index for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Helper function to check if a user is a global admin
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- RLS Policies for admin_users
-- Only global admins can see who else is an admin
CREATE POLICY "Admins can view admin_users" ON public.admin_users
    FOR SELECT USING (is_admin());

-- Update other table policies to grant access to global admins
-- This ensures administrators can manage the whole system regardless of tenant isolation

-- Empresas
CREATE POLICY "Global Admins bypass - empresas" ON public.empresas
    FOR ALL USING (is_admin());

-- Usuarios
CREATE POLICY "Global Admins bypass - usuarios" ON public.usuarios
    FOR ALL USING (is_admin());

-- Clientes
CREATE POLICY "Global Admins bypass - clientes" ON public.clientes
    FOR ALL USING (is_admin());

-- Servicos
CREATE POLICY "Global Admins bypass - servicos" ON public.servicos
    FOR ALL USING (is_admin());

-- Profissionais
CREATE POLICY "Global Admins bypass - profissionais" ON public.profissionais
    FOR ALL USING (is_admin());

-- Agendamentos
CREATE POLICY "Global Admins bypass - agendamentos" ON public.agendamentos
    FOR ALL USING (is_admin());

-- Conversas
CREATE POLICY "Global Admins bypass - conversas" ON public.conversas
    FOR ALL USING (is_admin());
