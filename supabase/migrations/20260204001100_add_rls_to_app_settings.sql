-- Migration: Add RLS to App Settings
-- Date: 2026-02-04
-- Description: Enables RLS on app_settings and allows Global Admins to manage it.

BEGIN;

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 1. Policy for Global Admins (Full Access)
-- We use the existing public.is_admin() helper
DROP POLICY IF EXISTS "Global Admins can manage app_settings" ON public.app_settings;
CREATE POLICY "Global Admins can manage app_settings"
ON public.app_settings
FOR ALL
TO authenticated
USING (public.is_admin());

-- 2. Force RLS
ALTER TABLE public.app_settings FORCE ROW LEVEL SECURITY;

COMMIT;
