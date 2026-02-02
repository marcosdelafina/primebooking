-- Add profile and display fields to empresas
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS imagem_url TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS galeria TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS horario_abertura TEXT DEFAULT '09:00';
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS horario_fechamento TEXT DEFAULT '18:00';
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS dias_funcionamento TEXT[] DEFAULT '{"seg", "ter", "qua", "qui", "sex", "sab"}'::text[];

-- Add rating fields for future use
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 5.0;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS avaliacoes INTEGER DEFAULT 0;

-- Update RLS to allow public access to directory fields
-- Drop previous public policy if exists to avoid conflicts
DROP POLICY IF EXISTS "Public companies find by slug" ON public.empresas;
CREATE POLICY "Public companies directory" ON public.empresas
    FOR SELECT USING (true);
