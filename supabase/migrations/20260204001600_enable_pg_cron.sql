-- Migration: Enable Scheduling Extensions
-- Date: 2026-02-04
-- Description: Enables pg_cron for scheduled tasks and ensuring pg_net is available.

BEGIN;

-- Enable pg_cron for background scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Ensure pg_net is enabled (used for calling Edge Functions)
CREATE EXTENSION IF NOT EXISTS pg_net;

COMMIT;
