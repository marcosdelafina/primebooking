-- Migration: Denormalize Client Data and Add Sync Triggers
-- Date: 2026-02-06
-- Description: Syncs name, phone, and email from clientes_global to clientes_empresa automatically.

BEGIN;

-- 1. Function to sync data from Global to Empresa (On Update)
CREATE OR REPLACE FUNCTION public.fn_sync_global_client_to_empresa()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.clientes_empresa
    SET 
        nome = NEW.nome,
        telefone = NEW.telefone,
        email = NEW.email
    WHERE cliente_global_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger for Global Updates
DROP TRIGGER IF EXISTS tr_sync_global_client_to_empresa ON public.clientes_global;
CREATE TRIGGER tr_sync_global_client_to_empresa
    AFTER UPDATE OF nome, telefone, email ON public.clientes_global
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_sync_global_client_to_empresa();

-- 3. Function to populate Empresa data from Global (On Insert)
CREATE OR REPLACE FUNCTION public.fn_populate_empresa_client_from_global()
RETURNS TRIGGER AS $$
BEGIN
    SELECT nome, telefone, email 
    INTO NEW.nome, NEW.telefone, NEW.email
    FROM public.clientes_global
    WHERE id = NEW.cliente_global_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger for Empresa Inserts
DROP TRIGGER IF EXISTS tr_populate_empresa_client_from_global ON public.clientes_empresa;
CREATE TRIGGER tr_populate_empresa_client_from_global
    BEFORE INSERT ON public.clientes_empresa
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_populate_empresa_client_from_global();

-- 5. Backfill existing NULL data
UPDATE public.clientes_empresa ce
SET 
    nome = cg.nome,
    telefone = cg.telefone,
    email = cg.email
FROM public.clientes_global cg
WHERE ce.cliente_global_id = cg.id
AND (ce.nome IS NULL OR ce.telefone IS NULL OR ce.email IS NULL);

COMMIT;
