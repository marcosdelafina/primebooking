-- Migration: Payment History Schema
-- Date: 2026-02-02
-- Description: Creates subscription_invoices table to store payment history and extratos.

BEGIN;

CREATE TABLE IF NOT EXISTS public.subscription_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED')),
    due_date DATE NOT NULL,
    period TEXT NOT NULL, -- Format: YYYY-MM
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_empresa_id ON public.subscription_invoices(empresa_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status ON public.subscription_invoices(status);

-- RLS Policies
CREATE POLICY "Global Admins view all invoices" ON public.subscription_invoices
    FOR ALL USING (public.is_admin());

CREATE POLICY "Company users view own invoices" ON public.subscription_invoices
    FOR SELECT USING (empresa_id = public.get_my_company_id());

COMMIT;
