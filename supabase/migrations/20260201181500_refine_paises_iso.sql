-- Refine paises table to include ISO codes for better phone number integration
ALTER TABLE public.paises
ADD COLUMN IF NOT EXISTS sigla_iso CHAR(2);

-- Temporary table to hold new data
CREATE TEMP TABLE tmp_paises (
    label TEXT,
    sigla_iso CHAR(2),
    code TEXT
);

INSERT INTO tmp_paises (label, sigla_iso, code) VALUES
('Afeganistão', 'AF', '+93'),
('África do Sul', 'ZA', '+27'),
('Albânia', 'AL', '+355'),
('Alemanha', 'DE', '+49'),
('Andorra', 'AD', '+376'),
('Angola', 'AO', '+244'),
('Antígua e Barbuda', 'AG', '+1-268'),
('Arábia Saudita', 'SA', '+966'),
('Argélia', 'DZ', '+213'),
('Argentina', 'AR', '+54'),
('Armênia', 'AM', '+374'),
('Austrália', 'AU', '+61'),
('Áustria', 'AT', '+43'),
('Azerbaijão', 'AZ', '+994'),
('Bahamas', 'BS', '+1-242'),
('Bangladesh', 'BD', '+880'),
('Barbados', 'BB', '+1-246'),
('Bélgica', 'BE', '+32'),
('Belize', 'BZ', '+501'),
('Benim', 'BJ', '+229'),
('Bolívia', 'BO', '+591'),
('Bósnia e Herzegovina', 'BA', '+387'),
('Botsuana', 'BW', '+267'),
('Brasil', 'BR', '+55'),
('Brunei', 'BN', '+673'),
('Bulgária', 'BG', '+359'),
('Cabo Verde', 'CV', '+238'),
('Camarões', 'CM', '+237'),
('Canadá', 'CA', '+1'),
('Catar', 'QA', '+974'),
('Chile', 'CL', '+56'),
('China', 'CN', '+86'),
('Chipre', 'CY', '+357'),
('Colômbia', 'CO', '+57'),
('Coreia do Sul', 'KR', '+82'),
('Costa Rica', 'CR', '+506'),
('Croácia', 'HR', '+385'),
('Cuba', 'CU', '+53'),
('Dinamarca', 'DK', '+45'),
('Dominica', 'DM', '+1-767'),
('Egito', 'EG', '+20'),
('El Salvador', 'SV', '+503'),
('Emirados Árabes Unidos', 'AE', '+971'),
('Equador', 'EC', '+593'),
('Eslováquia', 'SK', '+421'),
('Eslovênia', 'SI', '+386'),
('Espanha', 'ES', '+34'),
('Estados Unidos', 'US', '+1'),
('Estônia', 'EE', '+372'),
('Filipinas', 'PH', '+63'),
('Finlândia', 'FI', '+358'),
('França', 'FR', '+33'),
('Grécia', 'GR', '+30'),
('Guatemala', 'GT', '+502'),
('Honduras', 'HN', '+504'),
('Hungria', 'HU', '+36'),
('Índia', 'IN', '+91'),
('Indonésia', 'ID', '+62'),
('Irlanda', 'IE', '+353'),
('Islândia', 'IS', '+354'),
('Israel', 'IL', '+972'),
('Itália', 'IT', '+39'),
('Japão', 'JP', '+81'),
('México', 'MX', '+52'),
('Nigéria', 'NG', '+234'),
('Noruega', 'NO', '+47'),
('Nova Zelândia', 'NZ', '+64'),
('Países Baixos', 'NL', '+31'),
('Paraguai', 'PY', '+595'),
('Peru', 'PE', '+51'),
('Polônia', 'PL', '+48'),
('Portugal', 'PT', '+351'),
('Reino Unido', 'GB', '+44'),
('República Dominicana', 'DO', '+1-809'),
('Romênia', 'RO', '+40'),
('Suécia', 'SE', '+46'),
('Suíça', 'CH', '+41'),
('Turquia', 'TR', '+90'),
('Ucrânia', 'UA', '+380'),
('Uruguai', 'UY', '+598'),
('Venezuela', 'VE', '+58');

-- Update the main table from tmp
-- Clean main table first to avoid duplicates or inconsistent data if re-running
TRUNCATE public.paises RESTART IDENTITY;

INSERT INTO public.paises (nome_pais, sigla_iso, codigo)
SELECT label, sigla_iso, CAST(REPLACE(REPLACE(code, '+', ''), '-', '') AS INT)
FROM tmp_paises;

DROP TABLE tmp_paises;

-- Add ddi column as TEXT to support display formatting if needed
ALTER TABLE public.paises ADD COLUMN IF NOT EXISTS ddi_display TEXT;
UPDATE public.paises p
SET ddi_display = t.c
FROM (
    SELECT 'Afeganistão' as l, '+93' as c UNION ALL
    SELECT 'África do Sul', '+27' UNION ALL
    SELECT 'Albânia', '+355' UNION ALL
    SELECT 'Alemanha', '+49' UNION ALL
    SELECT 'Andorra', '+376' UNION ALL
    SELECT 'Angola', '+244' UNION ALL
    SELECT 'Antígua e Barbuda', '+1-268' UNION ALL
    SELECT 'Arábia Saudita', '+966' UNION ALL
    SELECT 'Argélia', '+213' UNION ALL
    SELECT 'Argentina', '+54' UNION ALL
    SELECT 'Armênia', '+374' UNION ALL
    SELECT 'Austrália', '+61' UNION ALL
    SELECT 'Áustria', '+43' UNION ALL
    SELECT 'Azerbaijão', '+994' UNION ALL
    SELECT 'Bahamas', '+1-242' UNION ALL
    SELECT 'Bangladesh', '+880' UNION ALL
    SELECT 'Barbados', '+1-246' UNION ALL
    SELECT 'Bélgica', '+32' UNION ALL
    SELECT 'Belize', '+501' UNION ALL
    SELECT 'Benim', '+229' UNION ALL
    SELECT 'Bolívia', '+591' UNION ALL
    SELECT 'Bósnia e Herzegovina', '+387' UNION ALL
    SELECT 'Botsuana', '+267' UNION ALL
    SELECT 'Brasil', '+55' UNION ALL
    SELECT 'Brunei', '+673' UNION ALL
    SELECT 'Bulgária', '+359' UNION ALL
    SELECT 'Cabo Verde', '+238' UNION ALL
    SELECT 'Camarões', '+237' UNION ALL
    SELECT 'Canadá', '+1' UNION ALL
    SELECT 'Catar', '+974' UNION ALL
    SELECT 'Chile', '+56' UNION ALL
    SELECT 'China', '+86' UNION ALL
    SELECT 'Chipre', '+357' UNION ALL
    SELECT 'Colômbia', '+57' UNION ALL
    SELECT 'Coreia do Sul', '+82' UNION ALL
    SELECT 'Costa Rica', '+506' UNION ALL
    SELECT 'Croácia', '+385' UNION ALL
    SELECT 'Cuba', '+53' UNION ALL
    SELECT 'Dinamarca', '+45' UNION ALL
    SELECT 'Dominica', '+1-767' UNION ALL
    SELECT 'Egito', '+20' UNION ALL
    SELECT 'El Salvador', '+503' UNION ALL
    SELECT 'Emirados Árabes Unidos', '+971' UNION ALL
    SELECT 'Equador', '+593' UNION ALL
    SELECT 'Eslováquia', '+421' UNION ALL
    SELECT 'Eslovênia', '+386' UNION ALL
    SELECT 'Espanha', '+34' UNION ALL
    SELECT 'Estados Unidos', '+1' UNION ALL
    SELECT 'Estônia', '+372' UNION ALL
    SELECT 'Filipinas', '+63' UNION ALL
    SELECT 'Finlândia', '+358' UNION ALL
    SELECT 'França', '+33' UNION ALL
    SELECT 'Grécia', '+30' UNION ALL
    SELECT 'Guatemala', '+502' UNION ALL
    SELECT 'Honduras', '+504' UNION ALL
    SELECT 'Hungria', '+36' UNION ALL
    SELECT 'Índia', '+91' UNION ALL
    SELECT 'Indonésia', '+62' UNION ALL
    SELECT 'Irlanda', '+353' UNION ALL
    SELECT 'Islândia', '+354' UNION ALL
    SELECT 'Israel', '+972' UNION ALL
    SELECT 'Itália', '+39' UNION ALL
    SELECT 'Japão', '+81' UNION ALL
    SELECT 'México', '+52' UNION ALL
    SELECT 'Nigéria', '+234' UNION ALL
    SELECT 'Noruega', '+47' UNION ALL
    SELECT 'Nova Zelândia', '+64' UNION ALL
    SELECT 'Países Baixos', '+31' UNION ALL
    SELECT 'Paraguai', '+595' UNION ALL
    SELECT 'Peru', '+51' UNION ALL
    SELECT 'Polônia', '+48' UNION ALL
    SELECT 'Portugal', '+351' UNION ALL
    SELECT 'Reino Unido', '+44' UNION ALL
    SELECT 'República Dominicana', '+1-809' UNION ALL
    SELECT 'Romênia', '+40' UNION ALL
    SELECT 'Suécia', '+46' UNION ALL
    SELECT 'Suíça', '+41' UNION ALL
    SELECT 'Turquia', '+90' UNION ALL
    SELECT 'Ucrânia', '+380' UNION ALL
    SELECT 'Uruguai', '+598' UNION ALL
    SELECT 'Venezuela', '+58'
) t WHERE p.nome_pais = t.l;
