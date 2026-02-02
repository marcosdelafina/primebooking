-- Allow anyone to see basic business info by slug
CREATE POLICY "Public companies find by slug" ON public.empresas
    FOR SELECT USING (true);

-- Allow anyone to see services of a company
CREATE POLICY "Public services by company" ON public.servicos
    FOR SELECT USING (true);

-- Allow anyone to see professionals of a company
CREATE POLICY "Public professionals by company" ON public.profissionais
    FOR SELECT USING (true);
