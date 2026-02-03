-- Migration: Reset default rating for newly created companies
-- Description: Changes default rating from 5.0 to 0.0 and updates existing new companies.

BEGIN;

-- 1. Change default value for rating column
ALTER TABLE public.empresas ALTER COLUMN rating SET DEFAULT 0.0;

-- 2. Update existing companies that have the old default and no evaluations
UPDATE public.empresas 
SET rating = 0.0 
WHERE rating = 5.0 AND avaliacoes = 0;

COMMIT;
