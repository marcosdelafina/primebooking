-- RPC to get user profile bypassing RLS
-- This is the safest way to break recursion and handle new user lag.

CREATE OR REPLACE FUNCTION public.get_user_profile(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT row_to_json(u) INTO result
    FROM public.usuarios u
    WHERE u.id = p_user_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
