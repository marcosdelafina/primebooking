-- Migration: Lock Appointment Status Updates
-- Description: Prevents updates to appointments once they reach 'cancelado' or 'nao_compareceu' status.

CREATE OR REPLACE FUNCTION public.check_appointment_status_lock()
RETURNS TRIGGER AS $$
BEGIN
    -- If the record is already in a terminal state, prevent any update
    IF OLD.status IN ('cancelado', 'nao_compareceu') THEN
        RAISE EXCEPTION 'Agendamentos com status final (cancelado ou não compareceu) não podem ser alterados.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to ensure idempotency during development
DROP TRIGGER IF EXISTS tr_appointment_status_lock ON public.agendamentos;

CREATE TRIGGER tr_appointment_status_lock
BEFORE UPDATE ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.check_appointment_status_lock();
