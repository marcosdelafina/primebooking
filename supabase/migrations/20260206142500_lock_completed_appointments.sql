-- Migration: Lock Completed Appointments
-- Date: 2026-02-06
-- Description: Extends the status lock to include 'concluido' status.

CREATE OR REPLACE FUNCTION public.check_appointment_status_lock()
RETURNS TRIGGER AS $$
BEGIN
    -- If the record is already in a terminal state, prevent any update
    IF OLD.status IN ('cancelado', 'nao_compareceu', 'concluido') THEN
        RAISE EXCEPTION 'Agendamentos com status final (concluído, cancelado ou não compareceu) não podem ser alterados.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
