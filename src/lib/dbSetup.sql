
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

-- Function to check if a table exists
CREATE OR REPLACE FUNCTION public.check_table_exists(table_name TEXT) 
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  exists_val BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = table_name
  ) INTO exists_val;
  
  RETURN exists_val;
END;
$$;

-- Function to create the system_settings table
CREATE OR REPLACE FUNCTION public.create_system_settings_table()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.system_settings (
    id INTEGER PRIMARY KEY,
    sensor_threshold NUMERIC NOT NULL DEFAULT 0.5,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  );
  
  -- Insert default record if not exists
  INSERT INTO public.system_settings (id, sensor_threshold)
  VALUES (1, 0.5)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Function to update system settings
CREATE OR REPLACE FUNCTION public.create_update_settings_function()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create the update_system_settings function
  CREATE OR REPLACE FUNCTION public.update_system_settings(
    p_sensor_threshold NUMERIC
  ) RETURNS BOOLEAN
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $func$
  BEGIN
    -- Validate sensor threshold value
    IF p_sensor_threshold < 0.1 OR p_sensor_threshold > 5 THEN
      RETURN FALSE;
    END IF;
    
    -- Update the settings
    UPDATE public.system_settings 
    SET 
      sensor_threshold = p_sensor_threshold,
      updated_at = now()
    WHERE id = 1;
    
    -- Check if update was successful
    IF FOUND THEN
      RETURN TRUE;
    ELSE
      -- If no row was updated, try to insert
      INSERT INTO public.system_settings (id, sensor_threshold)
      VALUES (1, p_sensor_threshold)
      ON CONFLICT (id) DO UPDATE
      SET 
        sensor_threshold = p_sensor_threshold,
        updated_at = now();
      
      RETURN TRUE;
    END IF;
  END;
  $func$;
END;
$$;

-- Function to get system settings
CREATE OR REPLACE FUNCTION public.get_system_settings()
RETURNS TABLE (
  sensor_threshold NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT s.sensor_threshold
  FROM public.system_settings s
  WHERE s.id = 1;
  
  -- If no rows returned, return default values
  IF NOT FOUND THEN
    sensor_threshold := 0.5;
    RETURN NEXT;
  END IF;
END;
$$;
