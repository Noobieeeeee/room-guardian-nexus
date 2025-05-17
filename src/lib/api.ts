
import { Room, Schedule, User, ActivityLog } from './types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Room API
export const getRooms = async (): Promise<Room[]> => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*');
    
    if (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }
    
    // Transform the data from snake_case to camelCase
    return data.map(room => ({
      id: room.id,
      name: room.name,
      status: room.status,
      currentDraw: room.current_draw,
      lastUpdated: room.last_updated || new Date().toISOString()
    })) || [];
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export const updateRoomStatus = async (id: number, status: string): Promise<Room> => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error updating room status:', error);
      throw error;
    }
    
    // Transform the data from snake_case to camelCase
    return {
      id: data.id,
      name: data.name,
      status: data.status,
      currentDraw: data.current_draw,
      lastUpdated: data.last_updated || new Date().toISOString()
    };
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// User API
export const getUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
    
    return data.map(user => ({
      id: user.id.toString(),
      name: user.username,
      email: user.email,
      role: user.role as 'admin' | 'faculty' | 'guest'
    }));
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
  try {
    // In a real app, you might want to hash the password
    const { data, error } = await supabase
      .from('users')
      .insert({
        username: user.name,
        email: user.email,
        role: user.role,
        password_hash: 'password' // In a real app, you would hash this
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }
    
    return {
      id: data.id.toString(),
      name: data.username,
      email: data.email,
      role: data.role as 'admin' | 'faculty' | 'guest'
    };
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  try {
    const updateData: any = {};
    if (userData.name) updateData.username = userData.name;
    if (userData.email) updateData.email = userData.email;
    if (userData.role) updateData.role = userData.role;
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', parseInt(id))
      .select('*')
      .single();
    
    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }
    
    return {
      id: data.id.toString(),
      name: data.username,
      email: data.email,
      role: data.role as 'admin' | 'faculty' | 'guest'
    };
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', parseInt(id));
    
    if (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Schedule API
export const getSchedules = async (): Promise<Schedule[]> => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*');
    
    if (error) {
      console.error('Error fetching schedules:', error);
      throw error;
    }
    
    return data.map(schedule => ({
      id: schedule.id.toString(),
      roomId: schedule.room_id,
      title: schedule.title || '',
      description: schedule.description || '',
      userId: schedule.user_id.toString(),
      userName: schedule.user_name || '',
      date: schedule.date || '',
      startTime: schedule.start_time,
      endTime: schedule.end_time
    }));
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export const createSchedule = async (schedule: Omit<Schedule, 'id'>): Promise<Schedule> => {
  try {
    const currentUser = localStorage.getItem('currentUser');
    let userId = null;
    let userName = '';
    
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        userId = parseInt(user.id);
        userName = user.name;
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
        toast.error('Authentication error. Please log in again.');
        throw new Error('Authentication error');
      }
    }
    
    if (!userId) {
      toast.error('User ID is required to create a schedule');
      throw new Error('Missing user ID');
    }
    
    const { data, error } = await supabase
      .from('schedules')
      .insert({
        room_id: schedule.roomId,
        title: schedule.title,
        description: schedule.description,
        user_id: userId,
        user_name: userName,
        date: schedule.date,
        start_time: schedule.startTime,
        end_time: schedule.endTime
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
    
    return {
      id: data.id.toString(),
      roomId: data.room_id,
      title: data.title || '',
      description: data.description || '',
      userId: data.user_id.toString(),
      userName: data.user_name || '',
      date: data.date || '',
      startTime: data.start_time,
      endTime: data.end_time
    };
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export const updateSchedule = async (id: number, scheduleData: Partial<Schedule>): Promise<Schedule> => {
  try {
    const updateData: any = {};
    if (scheduleData.roomId !== undefined) updateData.room_id = scheduleData.roomId;
    if (scheduleData.title !== undefined) updateData.title = scheduleData.title;
    if (scheduleData.description !== undefined) updateData.description = scheduleData.description;
    if (scheduleData.date !== undefined) updateData.date = scheduleData.date;
    if (scheduleData.startTime !== undefined) updateData.start_time = scheduleData.startTime;
    if (scheduleData.endTime !== undefined) updateData.end_time = scheduleData.endTime;
    
    const { data, error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error updating schedule:', error);
      throw error;
    }
    
    return {
      id: data.id.toString(),
      roomId: data.room_id,
      title: data.title || '',
      description: data.description || '',
      userId: data.user_id.toString(),
      userName: data.user_name || '',
      date: data.date || '',
      startTime: data.start_time,
      endTime: data.end_time
    };
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export const deleteSchedule = async (id: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    }
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Activity logs API
export const getActivityLogs = async (): Promise<ActivityLog[]> => {
  try {
    const { data, error } = await supabase
      .rpc('query_activity_logs');
    
    if (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
    
    return data.map((log: any) => ({
      id: log.id.toString(),
      roomId: log.room_id,
      roomName: log.room_name,
      userId: log.user_id ? log.user_id.toString() : '',
      userName: log.user_name,
      date: log.date,
      time: log.time,
      status: log.status,
      details: log.details || ''
    }));
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
