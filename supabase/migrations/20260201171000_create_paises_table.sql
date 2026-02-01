-- Create a table for countries to support phone formatting and internationalization
CREATE TABLE IF NOT EXISTS public.paises (
    id SERIAL PRIMARY KEY,
    codigo INT UNIQUE NOT NULL, -- DDI/Country Code
    nome_pais TEXT NOT NULL
);

-- Grant access to the table
GRANT SELECT ON public.paises TO authenticated;
GRANT SELECT ON public.paises TO anon;
GRANT SELECT ON public.paises TO service_role;

-- Index for faster lookups by code
CREATE INDEX IF NOT EXISTS idx_paises_codigo ON public.paises(codigo);
