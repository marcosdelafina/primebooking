-- Migration: Fix Ambiguous Column Reference
-- Date: 2026-02-05
-- Description: Renames the internal variable in get_supabase_service_key to avoid ambiguity with the table column name.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_supabase_service_key()
RETURNS TEXT AS $$
DECLARE
    _service_key TEXT;
BEGIN
    SELECT value INTO _service_key FROM public.app_settings WHERE key = 'supabase_service_role_key';
    RETURN COALESCE(_service_key, 'KEY_NOT_SET');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMIT;
