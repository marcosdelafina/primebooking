-- Convert enterprises.categoria from TEXT to TEXT[]
DO $$ 
BEGIN 
    -- Check if it's already an array type
    IF (SELECT data_type FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'empresas' 
        AND column_name = 'categoria') = 'text' THEN
        
        -- Alter column to array type, migrating existing values
        ALTER TABLE public.empresas 
        ALTER COLUMN categoria TYPE TEXT[] USING 
        CASE 
            WHEN categoria IS NULL OR categoria = '' THEN '{}'::text[]
            ELSE ARRAY[categoria]
        END;
        
        -- Set default
        ALTER TABLE public.empresas ALTER COLUMN categoria SET DEFAULT '{}'::text[];
    END IF;
END $$;
