-- Create categorias_empresa table
CREATE TABLE IF NOT EXISTS public.categorias_empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.categorias_empresa ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read-only access to categories"
    ON public.categorias_empresa FOR SELECT
    USING (ativo = true);

CREATE POLICY "Allow global admins to manage categories"
    ON public.categorias_empresa FOR ALL
    USING (public.is_admin_global_safe());

-- Seed with initial categories
INSERT INTO public.categorias_empresa (nome, slug, ordem)
VALUES 
    ('Salão de Beleza', 'salao-de-beleza', 1),
    ('Barbearia', 'barbearia', 2),
    ('Spa & Bem-estar', 'spa-bem-estar', 3),
    ('Estética', 'estetica', 4),
    ('Saúde', 'saude', 5),
    ('Academia', 'academia', 6),
    ('Educação', 'educacao', 7),
    ('Outros', 'outros', 8)
ON CONFLICT (nome) DO NOTHING;

-- Grant access to authenticated and anon users for select
GRANT SELECT ON public.categorias_empresa TO authenticated, anon;
GRANT ALL ON public.categorias_empresa TO service_role;
