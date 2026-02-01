-- Migration: Create estados and municipios tables
CREATE TABLE IF NOT EXISTS public.estados (
    id SERIAL PRIMARY KEY,
    codigo_ibge_uf INT UNIQUE NOT NULL,
    nome_uf TEXT NOT NULL,
    sigla CHAR(2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.municipios (
    id SERIAL PRIMARY KEY,
    codigo_ibge_municipio INT UNIQUE NOT NULL,
    nome_municipio TEXT NOT NULL,
    codigo_ibge_uf INT NOT NULL REFERENCES public.estados(codigo_ibge_uf)
);

-- Enable RLS (Read-only for authenticated users)
ALTER TABLE public.estados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all for estados" ON public.estados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to all for municipios" ON public.municipios FOR SELECT TO authenticated USING (true);

-- Add indexes for common lookups
CREATE INDEX idx_municipios_codigo_ibge_uf ON public.municipios(codigo_ibge_uf);
CREATE INDEX idx_municipios_nome_municipio ON public.municipios(nome_municipio);
