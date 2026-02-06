-- Migration: Add updated_at to empresas
-- Date: 2026-02-06
-- Description: Adds missing updated_at column to empresas table to support triggers and tracking.

BEGIN;

-- 1. Add updated_at column if it doesn't exist
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Add trigger to automatically update updated_at on change
-- Use the existing update_updated_at_column function if it exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_empresas_updated_at') THEN
        CREATE TRIGGER update_empresas_updated_at
            BEFORE UPDATE ON public.empresas
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

COMMIT;
