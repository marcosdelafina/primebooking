-- Migration: Create plataforma_avaliacoes table
-- Description: Store platform reviews from business owners

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'avaliacao_status') THEN
        CREATE TYPE avaliacao_status AS ENUM ('pending', 'active', 'inactive');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS plataforma_avaliacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT,
    status avaliacao_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_avaliacoes_status ON plataforma_avaliacoes(status);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_empresa ON plataforma_avaliacoes(empresa_id);

-- Enable RLS
ALTER TABLE plataforma_avaliacoes ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Anyone can see active reviews (Public)
CREATE POLICY "Public can view active reviews"
ON plataforma_avaliacoes FOR SELECT
USING (status = 'active');

-- 2. Store owners can see their own reviews (Admin Global bypasses this naturally via global policy if exists, but we define it here for clarity)
CREATE POLICY "Users can view their own reviews"
ON plataforma_avaliacoes FOR SELECT
USING (
    usuario_id = auth.uid() OR 
    (SELECT is_admin_global FROM usuarios WHERE id = auth.uid()) = true
);

-- 3. Store owners can insert their own reviews
-- We'll rely on application logic to prevent multiple active reviews if needed, 
-- but RLS ensures they can only tag it to themselves.
CREATE POLICY "Users can insert their own reviews"
ON plataforma_avaliacoes FOR INSERT
WITH CHECK (
    usuario_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM usuarios 
        WHERE id = auth.uid() 
        AND empresa_id = plataforma_avaliacoes.empresa_id
    )
);

-- 4. Global Admin can update (moderation)
CREATE POLICY "Global Admin can manage reviews"
ON plataforma_avaliacoes FOR UPDATE
USING (
    (SELECT is_admin_global FROM usuarios WHERE id = auth.uid()) = true
);

-- 5. Global Admin can delete
CREATE POLICY "Global Admin can delete reviews"
ON plataforma_avaliacoes FOR DELETE
USING (
    (SELECT is_admin_global FROM usuarios WHERE id = auth.uid()) = true
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql' SET search_path = public;

CREATE TRIGGER update_plataforma_avaliacoes_updated_at
    BEFORE UPDATE ON plataforma_avaliacoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
