-- Migration: Create WhatsApp Logs Table
-- Date: 2026-02-05
-- Description: Creates a table to track outgoing WhatsApp notifications.

create table if not exists public.whatsapp_logs (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid references public.empresas(id) on delete set null,
    appointment_id uuid references public.agendamentos(id) on delete set null,
    event_type text not null, -- e.g. 'appointment_confirmed', 'appointment_reminder'
    template_id text,
    recipient_phone text not null,
    status text not null, -- 'sent', 'failed', 'skipped'
    provider_message_id text, -- Twilio Message SID
    error_message text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Add RLS policies
alter table public.whatsapp_logs enable row level security;

-- Allow read access to authenticated users belonging to the company
create policy "Tenant isolation - whatsapp_logs"
    on public.whatsapp_logs
    for all
    using (empresa_id = public.get_my_company_id());

-- Index for faster queries
create index if not exists idx_whatsapp_logs_appointment_id on public.whatsapp_logs(appointment_id);
create index if not exists idx_whatsapp_logs_empresa_id on public.whatsapp_logs(empresa_id);
