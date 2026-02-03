-- Migration: Fix Search Path for get_supabase_url
-- Date: 2026-02-04
-- Description: Sets the search_path to 'public' to resolve security lint warning.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_supabase_url()
RETURNS TEXT AS $$
DECLARE
    url TEXT;
BEGIN
    SELECT value INTO url FROM public.app_settings WHERE key = 'supabase_url';
    RETURN COALESCE(url, 'https://PROJECT_URL_NOT_SET.supabase.co');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMIT;
