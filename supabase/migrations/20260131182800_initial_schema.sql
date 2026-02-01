-- Enable Extensions if needed (gen_random_uuid is built-in for PG 13+)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: empresas
CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plano TEXT NOT NULL DEFAULT 'basic',
    whatsapp_number_id TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: clientes
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL, -- E.164 format
    google_contact_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: servicos
CREATE TABLE IF NOT EXISTS public.servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    duracao_min INT NOT NULL,
    preco NUMERIC(12,2),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: profissionais
CREATE TABLE IF NOT EXISTS public.profissionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT,
    google_calendar_id TEXT,
    google_refresh_token TEXT, -- Encrypted
    disponibilidade JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: agendamentos
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    profissional_id UUID REFERENCES public.profissionais(id) ON DELETE SET NULL,
    servico_id UUID REFERENCES public.servicos(id) ON DELETE SET NULL,
    data_inicio TIMESTAMPTZ NOT NULL,
    data_fim TIMESTAMPTZ NOT NULL,
    google_event_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: conversas
CREATE TABLE IF NOT EXISTS public.conversas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    telefone_cliente TEXT NOT NULL,
    estado_fluxo TEXT DEFAULT 'awaiting_service',
    dados_parciais JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;

-- Add Indexes for Performance (Rule 12)
CREATE INDEX idx_usuarios_empresa_id ON public.usuarios(empresa_id);
CREATE INDEX idx_clientes_empresa_id ON public.clientes(empresa_id);
CREATE INDEX idx_servicos_empresa_id ON public.servicos(empresa_id);
CREATE INDEX idx_profissionais_empresa_id ON public.profissionais(empresa_id);
CREATE INDEX idx_agendamentos_empresa_id ON public.agendamentos(empresa_id);
CREATE INDEX idx_agendamentos_cliente_id ON public.agendamentos(cliente_id);
CREATE INDEX idx_agendamentos_profissional_id ON public.agendamentos(profissional_id);
CREATE INDEX idx_agendamentos_servico_id ON public.agendamentos(servico_id);
CREATE INDEX idx_conversas_empresa_id ON public.conversas(empresa_id);
CREATE INDEX idx_conversas_telefone_cliente ON public.conversas(telefone_cliente);

-- lookup function for tenant isolation
CREATE OR REPLACE FUNCTION public.get_my_company_id() RETURNS UUID AS $$
    SELECT empresa_id FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Tenant Isolation Policies (Rule 02)
CREATE POLICY "Tenant isolation - empresas" ON public.empresas
    FOR ALL USING (id = get_my_company_id());

CREATE POLICY "Tenant isolation - usuarios" ON public.usuarios
    FOR ALL USING (empresa_id = get_my_company_id());

CREATE POLICY "Tenant isolation - clientes" ON public.clientes
    FOR ALL USING (empresa_id = get_my_company_id());

CREATE POLICY "Tenant isolation - servicos" ON public.servicos
    FOR ALL USING (empresa_id = get_my_company_id());

CREATE POLICY "Tenant isolation - profissionais" ON public.profissionais
    FOR ALL USING (empresa_id = get_my_company_id());

CREATE POLICY "Tenant isolation - agendamentos" ON public.agendamentos
    FOR ALL USING (empresa_id = get_my_company_id());

CREATE POLICY "Tenant isolation - conversas" ON public.conversas
    FOR ALL USING (empresa_id = get_my_company_id());
