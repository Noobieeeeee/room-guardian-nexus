
-- SQL functions for activity logs
-- These will be executed through the RPC calls in our code

-- Function to query activity logs with proper ordering
CREATE OR REPLACE FUNCTION public.query_activity_logs()
RETURNS SETOF public.activity_logs
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.activity_logs ORDER BY created_at DESC;
$$;

-- Function to insert an activity log and return the ID
CREATE OR REPLACE FUNCTION public.insert_activity_log(
  p_room_id INTEGER,
  p_room_name TEXT,
  p_user_id INTEGER,
  p_user_name TEXT,
  p_date DATE,
  p_time TIME,
  p_status TEXT,
  p_details TEXT
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id INTEGER;
BEGIN
  INSERT INTO public.activity_logs (
    room_id, room_name, user_id, user_name, date, time, status, details
  ) VALUES (
    p_room_id, p_room_name, p_user_id, p_user_name, p_date, p_time, p_status, p_details
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;
