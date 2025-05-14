
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
        created_at
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    return data.map(schedule => {
      // Extract date part from the timestamp
      const startDate = new Date(schedule.start_time);
      const dateStr = startDate.toISOString().split('T')[0];
      
      // Extract time parts from timestamps
      const startTime = schedule.start_time.split('T')[1].substring(0, 5);
      const endTime = schedule.end_time.split('T')[1].substring(0, 5);
      
      // Get the user's name from our map or use a fallback
      const userName = userMap.get(schedule.user_id) || 'Unknown User';
      
      return {
        id: schedule.id.toString(),
        roomId: schedule.room_id,
        title: `Room Booking #${schedule.id}`, // Default title since we don't have this column
        description: '', // Default empty description since we don't have this column
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
        user_id: parseInt(schedule.userId) // Convert string ID to number for the database
      })
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    // Update room status to reserved
    await updateRoomStatus(schedule.roomId, 'reserved');
    
    // Log this activity (skipping actual database insertion for now)
    const activityLogData = {
      roomId: schedule.roomId,
      roomName: `Room ${schedule.roomId}`,
      userId: schedule.userId,
      userName: schedule.userName,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      status: 'reserved' as const,
      details: `Room reserved: ${schedule.title}`
    };
    
    console.log('Activity logged (not saved to database):', activityLogData);
    
    // Format the returned schedule to match our type definition
    return {
      id: data.id.toString(),
      roomId: data.room_id,
      title: schedule.title,
      description: schedule.description,
      userId: data.user_id.toString(), // Convert to string to match our type
      userName: schedule.userName, 
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime
    };
  } catch (error) {
    console.error('Error creating schedule:', error);
    toast.error('Failed to create schedule');
    return null;
  }
}

// Activity Log APIs - Stub implementation for now as the table doesn't exist
export async function getActivityLogs(): Promise<ActivityLog[]> {
  console.log('Checking for activity_logs table');
  try {
    // Try to check if the activity_logs table exists without actually querying it
    const { error } = await supabase.rpc('check_table_exists', { table_name: 'activity_logs' });
    
    if (error) {
      console.error('Error checking activity_logs table:', error);
      // Table might not exist yet
      return [];
    }
    
    // If we're here, the table might exist, but since it's not in the provided schema,
    // we'll just return an empty array to avoid errors
    return [];
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    toast.error('Failed to load activity logs');
    return [];
  }
}

export async function createActivityLog(log: Omit<ActivityLog, 'id'>): Promise<ActivityLog | null> {
  // Since the activity_logs table doesn't exist yet, just return a mock object
  console.log('Activity log creation requested (not implemented):', log);
  return {
    id: '0',
    ...log
  };
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
