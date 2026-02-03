-- Fix RLS recursion for usuarios table
-- The original policy "Tenant isolation - usuarios" depends on get_my_company_id(),
-- which in turn queries the "usuarios" table, causing a potential recursion or 
-- failure for newly created users trying to read their own profile.

-- 1. Create a direct policy for users to see themselves
CREATE POLICY "Users can view own profile" 
ON public.usuarios 
FOR SELECT 
USING (auth.uid() = id);

-- 2. Create a direct policy for users to update themselves
CREATE POLICY "Users can update own profile" 
ON public.usuarios 
FOR UPDATE 
USING (auth.uid() = id);

-- 3. Note: The generic tenant isolation policy still exists for colleagues, 
-- but now that they can see themselves, get_my_company_id() will work during recursion.
