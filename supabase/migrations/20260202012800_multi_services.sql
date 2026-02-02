-- Migration to support multiple services per appointment
-- Phase 1: Add the column
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS servicos_ids UUID[] DEFAULT '{}'::uuid[];

-- Phase 2: Migrate existing single servico_id to the new array
UPDATE public.agendamentos 
SET servicos_ids = ARRAY[servico_id] 
WHERE servico_id IS NOT NULL AND (servicos_ids IS NULL OR cardinality(servicos_ids) = 0);

-- Phase 3: Add index for performance
CREATE INDEX IF NOT EXISTS idx_agendamentos_servicos_ids ON public.agendamentos USING GIN (servicos_ids);

-- Optional: Comments for clarity
COMMENT ON COLUMN public.agendamentos.servicos_ids IS 'Array of service IDs included in this appointment';
