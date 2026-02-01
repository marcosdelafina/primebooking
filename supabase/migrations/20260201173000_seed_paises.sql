-- Seed the paises table with initial data
INSERT INTO public.paises (codigo, nome_pais) VALUES
(4, 'Afeganistão'),
(8, 'Albânia'),
(12, 'Argélia'),
(20, 'Andorra'),
(24, 'Angola')
ON CONFLICT (codigo) DO NOTHING;
