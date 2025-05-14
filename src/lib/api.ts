
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
      status: room.status,
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
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('date, start_time');
      
    if (error) {
      throw error;
    }
    
    return data.map(schedule => ({
      id: schedule.id.toString(),
      roomId: schedule.room_id,
      title: schedule.title,
      description: schedule.description,
      userId: schedule.user_id,
      userName: schedule.user_name,
      date: schedule.date,
      startTime: schedule.start_time,
      endTime: schedule.end_time
    }));
  } catch (error) {
    console.error('Error fetching schedules:', error);
    toast.error('Failed to load schedules');
    return [];
  }
}

export async function createSchedule(schedule: Omit<Schedule, 'id'>): Promise<Schedule | null> {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .insert({
        room_id: schedule.roomId,
        title: schedule.title,
        description: schedule.description,
        user_id: schedule.userId,
        user_name: schedule.userName,
        date: schedule.date,
        start_time: schedule.startTime,
        end_time: schedule.endTime
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
    });
    
    return {
      id: data.id.toString(),
      roomId: data.room_id,
      title: data.title,
      description: data.description,
      userId: data.user_id,
      userName: data.user_name,
      date: data.date,
      startTime: data.start_time,
      endTime: data.end_time
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
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('date desc, time desc');
      
    if (error) {
      throw error;
    }
    
    return data.map(log => ({
      id: log.id.toString(),
      roomId: log.room_id,
      roomName: log.room_name,
      userId: log.user_id,
      userName: log.user_name,
      date: log.date,
      time: log.time,
      status: log.status,
      details: log.details
    }));
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    toast.error('Failed to load activity logs');
    return [];
  }
}

export async function createActivityLog(log: Omit<ActivityLog, 'id'>): Promise<ActivityLog | null> {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        room_id: log.roomId,
        room_name: log.roomName,
        user_id: log.userId,
        user_name: log.userName,
        date: log.date,
        time: log.time,
        status: log.status,
        details: log.details
      })
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return {
      id: data.id.toString(),
      roomId: data.room_id,
      roomName: data.room_name,
      userId: data.user_id,
      userName: data.user_name,
      date: data.date,
      time: data.time,
      status: data.status,
      details: data.details
    };
  } catch (error) {
    console.error('Error creating activity log:', error);
    toast.error('Failed to log activity');
    return null;
  }
}

// User APIs
export async function getUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');
      
    if (error) {
      throw error;
    }
    
    return data.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    toast.error('Failed to load users');
    return [];
  }
}
