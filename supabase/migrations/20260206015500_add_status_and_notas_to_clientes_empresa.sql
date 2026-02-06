-- Migration: Add missing columns to clientes_empresa
-- Date: 2026-02-06
-- Description: Adds 'status' and 'notas' columns to the clientes_empresa table to support progressive activation and admin notes.

BEGIN;

-- 1. Add 'status' column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'clientes_empresa' AND COLUMN_NAME = 'status') THEN
        ALTER TABLE public.clientes_empresa ADD COLUMN status TEXT DEFAULT 'ativo';
    END IF;
END $$;

-- 2. Add 'notas' column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'clientes_empresa' AND COLUMN_NAME = 'notas') THEN
        ALTER TABLE public.clientes_empresa ADD COLUMN notas TEXT;
    END IF;
END $$;

COMMIT;
