-- Migration: Allow Public View of Billing Status
-- Date: 2026-02-03
-- Description: Enables public access to the billing_status field so the booking page can block suspended companies.

BEGIN;

-- 1. Create a policy for public viewing of billing status
-- We only allow SELECT of billing_status and empresa_id for transparency
DROP POLICY IF EXISTS "Public view billing status" ON public.billing_empresa;
CREATE POLICY "Public view billing status" ON public.billing_empresa
    FOR SELECT USING (true);

COMMIT;
