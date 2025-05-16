
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
    // Check if the schedules table exists
    const { error: tablesError } = await supabase
      .from('schedules')
      .select('*')
      .limit(1);
    
    if (tablesError) {
      console.error('Error checking schedules table:', tablesError);
      return [];
    }
    
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
      .select(`
        id, 
        room_id,
        start_time,
        end_time,
        user_id,
        title,
        description,
        user_name,
        date,
        created_at
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    return data.map(schedule => {
      // If date is missing, extract it from start_time
      const dateStr = schedule.date 
        ? schedule.date 
        : new Date(schedule.start_time).toISOString().split('T')[0];
      
      // Extract time parts from timestamps
      const startTime = schedule.start_time.split('T')[1].substring(0, 5);
      const endTime = schedule.end_time.split('T')[1].substring(0, 5);
      
      // Get the user's name from our map, schedule.user_name, or use a fallback
      const userName = schedule.user_name || userMap.get(schedule.user_id) || 'Unknown User';
      
      return {
        id: schedule.id.toString(),
        roomId: schedule.room_id,
        title: schedule.title || `Room Booking #${schedule.id}`,
        description: schedule.description || '',
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
      id: '0', // This will be replaced by the server
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
    // Try to check if the activity_logs table exists
    const { error } = await supabase.rpc('check_table_exists', { table_name: 'activity_logs' });
    
    if (error) {
      console.error('Error checking activity_logs table:', error);
      // Table might not exist yet
      return [];
    }
    
    // If the table exists, try to query it
    try {
      const { data, error: queryError } = await supabase.from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (queryError) {
        throw queryError;
      }
      
      if (!data) {
        return [];
      }
      
      return data.map(log => ({
        id: log.id.toString(),
        roomId: log.room_id,
        roomName: log.room_name,
        userId: log.user_id ? log.user_id.toString() : '',
        userName: log.user_name,
        date: log.date,
        time: log.time,
        status: log.status as 'available' | 'in-use' | 'reserved',
        details: log.details || ''
      }));
    } catch (queryErr) {
      console.error('Error querying activity_logs:', queryErr);
      return [];
    }
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    toast.error('Failed to load activity logs');
    return [];
  }
}

export async function createActivityLog(log: Omit<ActivityLog, 'id'>): Promise<ActivityLog | null> {
  try {
    // Check if activity_logs table exists
    const { error: checkError } = await supabase.rpc('check_table_exists', { table_name: 'activity_logs' });
    
    if (checkError) {
      console.error('Activity logs table may not exist:', checkError);
      // Return mock object since we can't log
      return {
        id: '0',
        ...log
      };
    }
    
    // Insert the activity log
    try {
      const { data, error: insertError } = await supabase.from('activity_logs')
        .insert({
          room_id: log.roomId,
          room_name: log.roomName,
          user_id: log.userId ? parseInt(log.userId) : null,
          user_name: log.userName,
          date: log.date,
          time: log.time,
          status: log.status,
          details: log.details
        })
        .select()
        .single();
        
      if (insertError) {
        throw insertError;
      }
      
      return {
        id: data.id.toString(),
        roomId: data.room_id,
        roomName: data.room_name,
        userId: data.user_id ? data.user_id.toString() : '',
        userName: data.user_name,
        date: data.date,
        time: data.time,
        status: data.status as 'available' | 'in-use' | 'reserved',
        details: data.details || ''
      };
    } catch (insertErr) {
      console.error('Error inserting activity log:', insertErr);
      // Return mock object on failure
      return {
        id: '0',
        ...log
      };
    }
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
