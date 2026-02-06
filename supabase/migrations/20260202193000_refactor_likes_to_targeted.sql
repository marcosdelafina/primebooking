-- Refactor likes system to support targeted likes (businesses)

-- 1. Modify likes_events to support target_id
ALTER TABLE likes_events DROP CONSTRAINT IF EXISTS likes_events_session_id_key;
ALTER TABLE likes_events ADD COLUMN IF NOT EXISTS target_id TEXT DEFAULT 'global';

-- 2. Add unique constraint for (session_id, target_id)
-- This ensures a session can like many things, but each thing only once.
ALTER TABLE likes_events ADD CONSTRAINT likes_events_session_target_unique UNIQUE (session_id, target_id);

-- 3. Update increment function to handle targets
CREATE OR REPLACE FUNCTION increment_likes(p_target_id TEXT, p_session_id TEXT)
RETURNS BIGINT AS $$
DECLARE
    v_total BIGINT;
BEGIN
    -- Check if session already liked this specific target
    IF EXISTS (SELECT 1 FROM likes_events WHERE session_id = p_session_id AND target_id = p_target_id) THEN
        SELECT total_likes INTO v_total FROM likes_counter WHERE id = p_target_id;
        RETURN COALESCE(v_total, 0);
    END IF;

    -- Ensure the counter row exists for this target
    INSERT INTO likes_counter (id, total_likes)
    VALUES (p_target_id, 0)
    ON CONFLICT (id) DO NOTHING;

    -- Record event (deduplication)
    INSERT INTO likes_events (session_id, target_id) VALUES (p_session_id, p_target_id)
    ON CONFLICT (session_id, target_id) DO NOTHING;

    -- Update counter
    UPDATE likes_counter 
    SET total_likes = total_likes + 1, updated_at = now()
    WHERE id = p_target_id
    RETURNING total_likes INTO v_total;

    RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Update permissions
GRANT EXECUTE ON FUNCTION increment_likes(TEXT, TEXT) TO anon, authenticated;

-- 5. Cleanup old function (optional but recommended)
-- DROP FUNCTION IF EXISTS increment_global_likes(TEXT);
