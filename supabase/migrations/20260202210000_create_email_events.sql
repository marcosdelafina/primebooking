-- Migration: Create Email Events Table
-- Date: 2026-02-02
-- Description: Adds a table to track email notifications sent via Resend.

BEGIN;

CREATE TABLE IF NOT EXISTS public.email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- e.g., 'password_reset', 'welcome', 'billing'
    recipient_type TEXT NOT NULL, -- 'user', 'owner', 'client'
    status TEXT NOT NULL DEFAULT 'pending',
    resend_email_id TEXT,
    resend_event_type TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- Policies (Global Admin Only or Company Admin for their own)
CREATE POLICY "Global Admins view all email events" ON public.email_events
    FOR ALL USING (public.is_admin());

CREATE POLICY "Company Admins view their email events" ON public.email_events
    FOR SELECT USING (company_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at_email_events
    BEFORE UPDATE ON public.email_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
