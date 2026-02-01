-- Add WhatsApp and DDI fields to empresas table
ALTER TABLE public.empresas
ADD COLUMN IF NOT EXISTS ddi INT DEFAULT 55, -- Default to Brazil
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.empresas.ddi IS 'Código de DDI do país (ex: 55)';
COMMENT ON COLUMN public.empresas.whatsapp IS 'Número de WhatsApp da empresa para atendimento';
