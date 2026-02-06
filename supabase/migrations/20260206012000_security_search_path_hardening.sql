-- Migration: Security Search Path Hardening
-- Description: Sets fixed search_path for all database functions to resolve security linter warnings.

DO $$
DECLARE
    v_func_record RECORD;
BEGIN
    FOR v_func_record IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as arguments
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    LOOP
        EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public', 
            v_func_record.schema_name, 
            v_func_record.function_name, 
            v_func_record.arguments);
    END LOOP;
END $$;
