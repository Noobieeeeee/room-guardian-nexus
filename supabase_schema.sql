-- Room Guardian Nexus - Supabase Database Schema
-- This script creates all necessary tables and functions for the application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS room_power_data CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS room_status CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS query_activity_logs();
DROP FUNCTION IF EXISTS insert_activity_log(integer, text, integer, text, date, time, text, text);

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'guest',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rooms table
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'available',
  current_draw DECIMAL(10,2) NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create room_status table
CREATE TABLE room_status (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES rooms(id),
  room_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  current_draw DECIMAL(10,2) NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create schedules table
CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES rooms(id),
  title VARCHAR(255),
  description TEXT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  user_name VARCHAR(255),
  date DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL,
  room_name VARCHAR(255) NOT NULL,
  user_id INTEGER REFERENCES users(id),
  user_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status VARCHAR(50) NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create room_power_data table
CREATE TABLE room_power_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id INTEGER NOT NULL REFERENCES rooms(id),
  current_draw DECIMAL(10,2) NOT NULL,
  device_id VARCHAR(255),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_settings table
CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  sensor_threshold DECIMAL(10,2) NOT NULL DEFAULT 1.0,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default system settings
INSERT INTO system_settings (sensor_threshold, email_notifications) 
VALUES (1.0, true);

-- Create indexes for better performance
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_schedules_room_id ON schedules(room_id);
CREATE INDEX idx_schedules_date ON schedules(date);
CREATE INDEX idx_activity_logs_room_id ON activity_logs(room_id);
CREATE INDEX idx_activity_logs_date ON activity_logs(date);
CREATE INDEX idx_room_power_data_room_id ON room_power_data(room_id);
CREATE INDEX idx_room_power_data_recorded_at ON room_power_data(recorded_at);

-- Function to query activity logs with proper ordering
CREATE OR REPLACE FUNCTION query_activity_logs()
RETURNS SETOF activity_logs
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM activity_logs ORDER BY created_at DESC;
$$;

-- Function to insert an activity log and return the ID
CREATE OR REPLACE FUNCTION insert_activity_log(
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
  INSERT INTO activity_logs (
    room_id, room_name, user_id, user_name, date, time, status, details
  ) VALUES (
    p_room_id, p_room_name, p_user_id, p_user_name, p_date, p_time, p_status, p_details
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Function to get latest power data
CREATE OR REPLACE FUNCTION get_latest_power_data()
RETURNS TABLE (
  room_id INTEGER,
  current_draw DECIMAL(10,2),
  recorded_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT DISTINCT ON (room_id) 
    room_id, 
    current_draw, 
    recorded_at 
  FROM room_power_data 
  ORDER BY room_id, recorded_at DESC;
$$;

-- Function to get system settings
CREATE OR REPLACE FUNCTION get_system_settings()
RETURNS TABLE (
  sensor_threshold DECIMAL(10,2),
  email_notifications BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT sensor_threshold, email_notifications FROM system_settings LIMIT 1;
$$;

-- Function to update system settings
CREATE OR REPLACE FUNCTION update_system_settings(
  p_sensor_threshold DECIMAL(10,2) DEFAULT NULL,
  p_email_notifications BOOLEAN DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE system_settings 
  SET 
    sensor_threshold = COALESCE(p_sensor_threshold, sensor_threshold),
    email_notifications = COALESCE(p_email_notifications, email_notifications),
    updated_at = NOW()
  WHERE id = 1;
  
  RETURN FOUND;
END;
$$;

-- Function to check if a table exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = $1
  );
END;
$$;

-- Function to create activity_logs table (used in migrations)
CREATE OR REPLACE FUNCTION create_activity_logs_table()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL,
    room_name VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    user_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
END;
$$;

-- Function to create the table existence check function
CREATE OR REPLACE FUNCTION create_check_table_exists_function()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function is already created above, but included for completeness
END;
$$;

-- Insert sample data for testing
-- First insert rooms
INSERT INTO rooms (id, name, status, current_draw, last_updated) VALUES
(101, 'Room 101', 'available', 0.00, NOW()),
(102, 'Room 102', 'in-use', 1.20, NOW()),
(103, 'Room 103', 'reserved', 0.80, NOW()),
(104, 'Room 104', 'available', 0.00, NOW()),
(105, 'Room 105', 'in-use', 1.50, NOW()),
(106, 'Room 106', 'reserved', 0.50, NOW());

-- Then insert users
-- Note: In a real application, you should never store plain text passwords
-- These are for development/testing purposes only
INSERT INTO users (id, username, email, password_hash, role) VALUES
(1, 'admin', 'admin@example.com', 'password', 'admin'),
(2, 'faculty', 'faculty@example.com', 'password', 'faculty'),
(3, 'guest', 'guest@example.com', 'password', 'guest');

-- Now we can safely insert schedules and activity logs
-- Sample schedules
INSERT INTO schedules (room_id, title, description, user_id, user_name, date, start_time, end_time) VALUES
(103, 'Mathematics 101', 'Introduction to Calculus', 1, 'Admin User', '2025-05-07', '09:00', '10:30'),
(106, 'Physics Lab', 'Electricity and Magnetism', 2, 'Faculty User', '2025-05-07', '11:00', '13:00'),
(102, 'Computer Science', 'Data Structures', 1, 'Admin User', '2025-05-08', '14:00', '15:30');

-- Sample activity logs
INSERT INTO activity_logs (room_id, room_name, user_id, user_name, date, time, status, details) VALUES
(103, 'Room 103', 1, 'Admin User', '2025-05-06', '09:05', 'reserved', 'Scheduled session started'),
(102, 'Room 102', 2, 'Faculty User', '2025-05-06', '11:02', 'in-use', 'Unscheduled usage detected'),
(105, 'Room 105', 1, 'Admin User', '2025-05-06', '13:15', 'available', 'Room freed up'),
(106, 'Room 106', 2, 'Faculty User', '2025-05-07', '10:00', 'reserved', 'Scheduled session started');