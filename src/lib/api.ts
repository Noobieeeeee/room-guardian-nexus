
import { supabase } from '@/integrations/supabase/client';
import { Room, Schedule, ActivityLog, User } from './types';
import { toast } from 'sonner';

// Room APIs
export async function getRooms(): Promise<Room[]> {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('id');
      
    if (error) {
      throw error;
    }
    
    return data.map(room => ({
      id: room.id,
      name: room.name,
      status: room.status as 'available' | 'in-use' | 'reserved', // Cast to match RoomStatus type
      currentDraw: room.current_draw,
      lastUpdated: room.last_updated
    }));
  } catch (error) {
    console.error('Error fetching rooms:', error);
    toast.error('Failed to load rooms');
    return [];
  }
}

export async function updateRoomStatus(roomId: number, status: 'available' | 'in-use' | 'reserved', currentDraw: number = 0): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('rooms')
      .update({
        status,
        current_draw: currentDraw,
        last_updated: new Date().toISOString()
      })
      .eq('id', roomId);
      
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating room status:', error);
    toast.error('Failed to update room status');
    return false;
  }
}

// Schedule APIs
export async function getSchedules(): Promise<Schedule[]> {
  try {
    // Get users for mapping
    const { data: users } = await supabase
      .from('users')
      .select('id, username');
    
    const userMap = new Map();
    if (users) {
      users.forEach(user => {
        // Use username instead of name
        userMap.set(user.id, user.username);
      });
    }
    
    const { data, error } = await supabase
      .from('schedules')
      .select('*');
      
    if (error) {
      throw error;
    }
    
    if (!data) return [];
    
    return data.map(schedule => {
      // Extract date part from start_time if date field is missing
      const dateStr = schedule.date ? 
        schedule.date : 
        new Date(schedule.start_time).toISOString().split('T')[0];
      
      // Extract time parts from timestamps
      const startTime = schedule.start_time.split('T')[1]?.substring(0, 5) || '00:00';
      const endTime = schedule.end_time.split('T')[1]?.substring(0, 5) || '00:00';
      
      // Get the user's name from our map, schedule.user_name, or use a fallback
      const userName = schedule.user_name || userMap.get(schedule.user_id) || 'Unknown User';
      
      // Handle optional fields that may not exist in all records
      const title = schedule.title || `Room Booking #${schedule.id}`;
      const description = schedule.description || '';
      
      return {
        id: schedule.id.toString(),
        roomId: schedule.room_id,
        title: title,
        description: description,
        userId: schedule.user_id.toString(), // Convert to string to match our type definition
        userName: userName,
        date: dateStr,
        startTime: startTime,
        endTime: endTime
      };
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    toast.error('Failed to load schedules');
    return [];
  }
}

export async function createSchedule(schedule: Omit<Schedule, 'id'>): Promise<Schedule | null> {
  try {
    // Get the formatted date in ISO format for start and end times
    const startDateTime = `${schedule.date}T${schedule.startTime}:00`;
    const endDateTime = `${schedule.date}T${schedule.endTime}:00`;
    
    const { data, error } = await supabase
      .from('schedules')
      .insert({
        room_id: schedule.roomId,
        start_time: startDateTime,
        end_time: endDateTime,
        user_id: parseInt(schedule.userId), // Convert string ID to number for the database
        title: schedule.title,
        description: schedule.description,
        user_name: schedule.userName,
        date: schedule.date
      })
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    // Update room status to reserved
    await updateRoomStatus(schedule.roomId, 'reserved');
    
    // Log this activity
    await createActivityLog({
      roomId: schedule.roomId,
      roomName: `Room ${schedule.roomId}`,
      userId: schedule.userId,
      userName: schedule.userName,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      status: 'reserved',
      details: `Room reserved: ${schedule.title}`
    }).catch(err => {
      // Log but don't fail if activity logging fails
      console.error('Failed to log activity:', err);
    });
    
    // Format the returned schedule to match our type definition
    return {
      id: data.id.toString(),
      roomId: data.room_id,
      title: data.title || `Room Booking #${data.id}`,
      description: data.description || '',
      userId: data.user_id.toString(), // Convert to string to match our type
      userName: data.user_name || schedule.userName, 
      date: data.date || schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime
    };
  } catch (error) {
    console.error('Error creating schedule:', error);
    toast.error('Failed to create schedule');
    return null;
  }
}

// Activity Log APIs
export async function getActivityLogs(): Promise<ActivityLog[]> {
  try {
    // First check if the table exists using our RPC function
    const { data: tableExists, error: checkError } = await supabase.rpc(
      'check_table_exists', 
      { table_name: 'activity_logs' }
    );
    
    if (checkError || !tableExists) {
      console.error('Error checking activity_logs table:', checkError);
      // Table might not exist yet
      return [];
    }
    
    // Use the RPC function instead of direct table access
    const { data, error } = await supabase.rpc(
      'query_activity_logs'
    );
    
    if (error) {
      console.error('Error querying activity_logs:', error);
      return [];
    }
    
    // If no data, return empty array
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    // Process the data safely with type checking
    return data.map(log => ({
      id: log.id?.toString() || '0',
      roomId: log.room_id || 0,
      roomName: log.room_name || 'Unknown Room',
      userId: log.user_id ? log.user_id.toString() : '',
      userName: log.user_name || 'Unknown User',
      date: log.date || new Date().toISOString().split('T')[0],
      time: log.time || '00:00',
      status: (log.status as 'available' | 'in-use' | 'reserved') || 'available',
      details: log.details || ''
    }));
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    toast.error('Failed to load activity logs');
    return [];
  }
}

export async function createActivityLog(log: Omit<ActivityLog, 'id'>): Promise<ActivityLog | null> {
  try {
    // Check if activity_logs table exists
    const { data: tableExists, error: checkError } = await supabase.rpc(
      'check_table_exists', 
      { table_name: 'activity_logs' }
    );
    
    if (checkError || !tableExists) {
      console.error('Activity logs table may not exist:', checkError);
      // Return mock object since we can't log
      return {
        id: '0',
        ...log
      };
    }
    
    // Insert activity log using RPC
    const { data: logId, error } = await supabase.rpc(
      'insert_activity_log', 
      { 
        p_room_id: log.roomId,
        p_room_name: log.roomName,
        p_user_id: log.userId ? parseInt(log.userId) : null,
        p_user_name: log.userName,
        p_date: log.date,
        p_time: log.time,
        p_status: log.status,
        p_details: log.details || ''
      }
    );
    
    if (error) {
      throw error;
    }
    
    // If we successfully inserted the log, return a properly formatted object
    if (logId && typeof logId === 'number') {
      return {
        id: logId.toString(),
        ...log
      };
    }
    
    // Return a mock object with the log data if insert didn't return an ID
    return {
      id: '0',
      ...log
    };
  } catch (error) {
    console.error('Error creating activity log:', error);
    // Return mock object on failure
    return {
      id: '0',
      ...log
    };
  }
}

// User APIs
export async function getUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('username'); // Order by username instead of name
      
    if (error) {
      throw error;
    }
    
    return data.map(user => ({
      id: user.id.toString(),
      name: user.username, // Use username as the name
      email: user.email,
      role: user.role as 'admin' | 'faculty' | 'guest'
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    toast.error('Failed to load users');
    return [];
  }
}
