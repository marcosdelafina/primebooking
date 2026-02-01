-- Remove UNIQUE constraint from codigo column as multiple countries share the same DDI
ALTER TABLE public.paises DROP CONSTRAINT IF EXISTS paises_codigo_key;

-- Add index instead for performance (without uniqueness)
CREATE INDEX IF NOT EXISTS idx_paises_codigo ON public.paises(codigo);
