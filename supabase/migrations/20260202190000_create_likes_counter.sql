-- Create likes_counter table
CREATE TABLE IF NOT EXISTS likes_counter (
    id TEXT PRIMARY KEY DEFAULT 'global',
    total_likes BIGINT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure global row exists
INSERT INTO likes_counter (id, total_likes) 
VALUES ('global', 0) 
ON CONFLICT (id) DO NOTHING;

-- Session tracking for deduplication
CREATE TABLE IF NOT EXISTS likes_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Atomic increment function with session check
CREATE OR REPLACE FUNCTION increment_global_likes(p_session_id TEXT)
RETURNS BIGINT AS $$
DECLARE
    v_total BIGINT;
BEGIN
    -- Check if session already liked
    IF EXISTS (SELECT 1 FROM likes_events WHERE session_id = p_session_id) THEN
        SELECT total_likes INTO v_total FROM likes_counter WHERE id = 'global';
        RETURN v_total;
    END IF;

    -- Record event (deduplication)
    INSERT INTO likes_events (session_id) VALUES (p_session_id)
    ON CONFLICT (session_id) DO NOTHING;

    -- Update counter if row was inserted (or if we want to be safe, just update)
    UPDATE likes_counter 
    SET total_likes = total_likes + 1, updated_at = now()
    WHERE id = 'global'
    RETURNING total_likes INTO v_total;

    RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE likes_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read likes_counter"
ON likes_counter FOR SELECT
TO public
USING (true);

-- likes_events should be private or very restricted
CREATE POLICY "No public access to likes_events"
ON likes_events FOR ALL
TO public
USING (false);

-- Function permissions
GRANT EXECUTE ON FUNCTION increment_global_likes(TEXT) TO anon, authenticated;
