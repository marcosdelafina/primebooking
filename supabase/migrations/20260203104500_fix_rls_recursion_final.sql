-- Final and Correct Fix for RLS Recursion on usuarios table
-- Subqueries on the same table within a policy cause infinite recursion.
-- We must use SECURITY DEFINER functions to break the cycle.

-- 1. Ensure we have the security definer functions
CREATE OR REPLACE FUNCTION public.get_my_company_id_safe() 
RETURNS UUID AS $$
    SELECT empresa_id FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin_global_safe() 
RETURNS BOOLEAN AS $$
    SELECT COALESCE(is_admin_global, false) FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 2. Drop all previous attempts
DROP POLICY IF EXISTS "Tenant isolation - usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users can update own profile" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_self_select" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_colleagues_select" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_admin_global_select" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_self_update" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_self_delete" ON public.usuarios;

-- 3. Implement non-recursive policies
-- Rule: Use functions instead of subqueries to avoid recursion

-- SELECT: Users can see themselves OR colleagues OR if they are global admins
CREATE POLICY "usuarios_read_policy" 
ON public.usuarios 
FOR SELECT 
TO authenticated 
USING (
    id = auth.uid() OR 
    empresa_id = public.get_my_company_id_safe() OR 
    public.is_admin_global_safe()
);

-- UPDATE: Users can only update their own profile
CREATE POLICY "usuarios_update_policy" 
ON public.usuarios 
FOR UPDATE 
TO authenticated 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- DELETE: Users can only delete their own profile
CREATE POLICY "usuarios_delete_policy" 
ON public.usuarios 
FOR DELETE 
TO authenticated 
USING (id = auth.uid());
