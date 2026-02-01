-- Create a view for municipios with their respective states
CREATE OR REPLACE VIEW public.vw_municipios_com_estado AS
SELECT 
    m.id,
    m.codigo_ibge_municipio,
    m.nome_municipio,
    e.codigo_ibge_uf,
    e.nome_uf,
    e.sigla as sigla_uf
FROM 
    public.municipios m
JOIN 
    public.estados e ON m.codigo_ibge_uf = e.codigo_ibge_uf;

-- Grant access to the view
GRANT SELECT ON public.vw_municipios_com_estado TO authenticated;
GRANT SELECT ON public.vw_municipios_com_estado TO anon;
GRANT SELECT ON public.vw_municipios_com_estado TO service_role;
