ALTER TABLE public.empresas
ADD COLUMN IF NOT EXISTS documento TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS logradouro TEXT,
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS complemento TEXT,
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.empresas.documento IS 'CPF ou CNPJ da empresa (apenas números)';
COMMENT ON COLUMN public.empresas.cep IS 'CEP da empresa';
