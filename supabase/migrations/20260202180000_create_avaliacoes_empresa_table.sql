-- Migration: Create avaliacoes_empresa table
-- Description: Store reviews from clients to establishments

CREATE TABLE IF NOT EXISTS avaliacoes_empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    cliente_nome TEXT NOT NULL, -- Storing name for posterity/guest reviews
    nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT,
    status avaliacao_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_avaliacoes_empresa_status ON avaliacoes_empresa(status);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_empresa_empresa_id ON avaliacoes_empresa(empresa_id);

-- Enable RLS
ALTER TABLE avaliacoes_empresa ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Public can view active reviews for a specific business
CREATE POLICY "Public can view active business reviews"
ON avaliacoes_empresa FOR SELECT
USING (status = 'active');

-- 2. Business owners can view all reviews for their business
CREATE POLICY "Business owners can view their business reviews"
ON avaliacoes_empresa FOR SELECT
USING (
    empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()) OR
    (SELECT is_admin_global FROM usuarios WHERE id = auth.uid()) = true
);

-- 3. Anyone can insert a review (moderation will catch spam)
-- In a real app, we might restrict this to people with a completed appointment
CREATE POLICY "Public can insert business reviews"
ON avaliacoes_empresa FOR INSERT
WITH CHECK (true);

-- 4. Business owners can update (moderation)
CREATE POLICY "Business owners can moderate reviews"
ON avaliacoes_empresa FOR UPDATE
USING (
    empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()) OR
    (SELECT is_admin_global FROM usuarios WHERE id = auth.uid()) = true
);

-- 5. Business owners/Admin can delete
CREATE POLICY "Business owners can delete reviews"
ON avaliacoes_empresa FOR DELETE
USING (
    empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()) OR
    (SELECT is_admin_global FROM usuarios WHERE id = auth.uid()) = true
);

-- Trigger for updated_at
CREATE TRIGGER update_avaliacoes_empresa_updated_at
    BEFORE UPDATE ON avaliacoes_empresa
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update company rating when a review is approved/updated
CREATE OR REPLACE FUNCTION update_business_rating() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE empresas
    SET 
        rating = (
            SELECT COALESCE(AVG(nota)::numeric(2,1), 0)
            FROM avaliacoes_empresa
            WHERE empresa_id = COALESCE(NEW.empresa_id, OLD.empresa_id)
            AND status = 'active'
        ),
        avaliacoes = (
            SELECT COUNT(*)
            FROM avaliacoes_empresa
            WHERE empresa_id = COALESCE(NEW.empresa_id, OLD.empresa_id)
            AND status = 'active'
        )
    WHERE id = COALESCE(NEW.empresa_id, OLD.empresa_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER tr_update_business_rating
AFTER INSERT OR UPDATE OF status OR DELETE ON avaliacoes_empresa
FOR EACH ROW EXECUTE FUNCTION update_business_rating();
