-- Security Refinement for Geographical Data Tables
-- Ensure RLS is enabled and public read access is granted for reference data

-- 1. Paises Table Security
ALTER TABLE public.paises ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paises' AND policyname = 'Allow public read access for paises') THEN
        CREATE POLICY "Allow public read access for paises" ON public.paises
            FOR SELECT USING (true);
    END IF;
END $$;

-- 2. Estados Table Security (Update existing)
ALTER TABLE public.estados ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Drop old restricted policy if exists
    DROP POLICY IF EXISTS "Allow read access to all for estados" ON public.estados;
    
    -- Create new permissive policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'estados' AND policyname = 'Allow public read access for estados') THEN
        CREATE POLICY "Allow public read access for estados" ON public.estados
            FOR SELECT USING (true);
    END IF;
END $$;

-- 3. Municipios Table Security (Update existing)
ALTER TABLE public.municipios ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Drop old restricted policy if exists
    DROP POLICY IF EXISTS "Allow read access to all for municipios" ON public.municipios;
    
    -- Create new permissive policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'municipios' AND policyname = 'Allow public read access for municipios') THEN
        CREATE POLICY "Allow public read access for municipios" ON public.municipios
            FOR SELECT USING (true);
    END IF;
END $$;

-- 4. Ensure Grants for the View
GRANT SELECT ON public.vw_municipios_com_estado TO authenticated;
GRANT SELECT ON public.vw_municipios_com_estado TO anon;
GRANT SELECT ON public.vw_municipios_com_estado TO service_role;
