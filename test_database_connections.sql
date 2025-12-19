-- Test query to verify all tables are connected and running correctly
-- This query checks table existence, data integrity, and relationships

-- 1. Check if all tables exist
SELECT 
    table_name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'rooms', 'schedules', 'activity_logs', 'room_power_data', 'system_settings', 'room_status')
ORDER BY table_name;

-- 2. Count records in each table to verify data insertion
SELECT 
    'users' as table_name,
    COUNT(*) as record_count
FROM users
UNION ALL
SELECT 
    'rooms' as table_name,
    COUNT(*) as record_count
FROM rooms
UNION ALL
SELECT 
    'schedules' as table_name,
    COUNT(*) as record_count
FROM schedules
UNION ALL
SELECT 
    'activity_logs' as table_name,
    COUNT(*) as record_count
FROM activity_logs
UNION ALL
SELECT 
    'room_power_data' as table_name,
    COUNT(*) as record_count
FROM room_power_data
UNION ALL
SELECT 
    'system_settings' as table_name,
    COUNT(*) as record_count
FROM system_settings
UNION ALL
SELECT 
    'room_status' as table_name,
    COUNT(*) as record_count
FROM room_status
ORDER BY table_name;

-- 3. Test foreign key relationships by joining tables
-- Check schedules with rooms and users
SELECT 
    s.id as schedule_id,
    s.title,
    r.name as room_name,
    u.username as user_name
FROM schedules s
JOIN rooms r ON s.room_id = r.id
JOIN users u ON s.user_id = u.id
ORDER BY s.id;

-- 4. Check activity logs with rooms and users
SELECT 
    al.id as log_id,
    al.room_name,
    al.user_name,
    al.status,
    al.date,
    al.time
FROM activity_logs al
LEFT JOIN rooms r ON al.room_id = r.id
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC;

-- 5. Check room power data with rooms
SELECT 
    rpd.id,
    r.name as room_name,
    rpd.current_draw,
    rpd.recorded_at
FROM room_power_data rpd
JOIN rooms r ON rpd.room_id = r.id
ORDER BY rpd.recorded_at DESC;

-- 6. Test custom functions
-- Test query_activity_logs function
SELECT * FROM query_activity_logs() LIMIT 5;

-- Test get_latest_power_data function
SELECT * FROM get_latest_power_data();

-- Test get_system_settings function
SELECT * FROM get_system_settings();

-- 7. Check indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'rooms', 'schedules', 'activity_logs', 'room_power_data')
ORDER BY tablename, indexname;

-- 8. Verify system settings
SELECT 
    sensor_threshold,
    email_notifications,
    created_at,
    updated_at
FROM system_settings;

-- 9. Check room status with rooms
SELECT 
    rs.id,
    r.name as room_name,
    rs.status,
    rs.current_draw,
    rs.last_updated
FROM room_status rs
JOIN rooms r ON rs.room_id = r.id
ORDER BY rs.last_updated DESC;