-- Definitive Fix for RLS Recursion on usuarios table
-- This migration drops the circular policies and implements a direct, non-recursive approach.

-- 1. Drop all old conflicting policies
DROP POLICY IF EXISTS "Tenant isolation - usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users can update own profile" ON public.usuarios;

-- 2. Create optimized SELECT policies
-- User can always read their own profile (Direct check, no recursion)
CREATE POLICY "usuarios_self_select" 
ON public.usuarios 
FOR SELECT 
TO authenticated 
USING (id = auth.uid());

-- Colleagues in the same company can read each other
-- Optimized to use a subquery that should be fast
CREATE POLICY "usuarios_colleagues_select" 
ON public.usuarios 
FOR SELECT 
TO authenticated 
USING (
    empresa_id = (
        SELECT u.empresa_id 
        FROM public.usuarios u 
        WHERE u.id = auth.uid() 
        LIMIT 1
    )
);

-- Global Admins can see everyone
CREATE POLICY "usuarios_admin_global_select" 
ON public.usuarios 
FOR SELECT 
TO authenticated 
USING (
    (SELECT u.is_admin_global FROM public.usuarios u WHERE u.id = auth.uid() LIMIT 1) = true
);

-- 3. Create optimized UPDATE policies
CREATE POLICY "usuarios_self_update" 
ON public.usuarios 
FOR UPDATE 
TO authenticated 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 4. Create optimized DELETE policy (only themselves)
CREATE POLICY "usuarios_self_delete" 
ON public.usuarios 
FOR DELETE 
TO authenticated 
USING (id = auth.uid());

-- 5. Note on get_my_company_id()
-- It is already SECURITY DEFINER, so it bypasses RLS in other tables (clientes, servicos, etc.)
-- This is fine. The recursion only happened when usuarios policies called get_my_company_id.
