-- Migration: Make nome and telefone nullable in clientes_empresa
-- Date: 2026-02-06
-- Description: After splitting into global clients, these fields are redundant/optional in the tenant-specific link table.

BEGIN;

ALTER TABLE public.clientes_empresa ALTER COLUMN nome DROP NOT NULL;
ALTER TABLE public.clientes_empresa ALTER COLUMN telefone DROP NOT NULL;

COMMIT;
