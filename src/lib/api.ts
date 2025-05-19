import { Room, Schedule, User, ActivityLog, RoomStatus } from './types';
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

    // Transform the data from snake_case to camelCase and ensure correct typing
    return data.map(room => ({
      id: room.id,
      name: room.name,
      status: room.status as RoomStatus,
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

    // Transform the data from snake_case to camelCase and ensure correct typing
    return {
      id: data.id,
      name: data.name,
      status: data.status as RoomStatus,
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

    return data.map(schedule => {
      // Extract just the time part from the ISO timestamp
      let startTime = schedule.start_time;
      let endTime = schedule.end_time;

      // If the time is in ISO format (contains 'T'), extract just the time part (HH:MM)
      if (startTime && startTime.includes('T')) {
        startTime = startTime.split('T')[1].substring(0, 5);
      }

      if (endTime && endTime.includes('T')) {
        endTime = endTime.split('T')[1].substring(0, 5);
      }

      return {
        id: schedule.id.toString(),
        roomId: schedule.room_id,
        title: schedule.title || '',
        description: schedule.description || '',
        userId: schedule.user_id.toString(),
        userName: schedule.user_name || '',
        date: schedule.date || '',
        startTime: startTime,
        endTime: endTime
      };
    });
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
        // Make sure we have a valid number for userId
        if (user.id) {
          // First try to use the provided userId from the schedule if it exists
          if (schedule.userId) {
            userId = parseInt(schedule.userId);
            if (isNaN(userId)) {
              console.error('Invalid user ID format in schedule:', schedule.userId);
              userId = parseInt(user.id);
            }
          } else {
            // Otherwise use the current user's ID
            userId = parseInt(user.id);
          }

          // If parsing failed, log the error but continue with the original ID
          if (isNaN(userId)) {
            console.error('Failed to parse user ID as number:', user.id);
            // Try to use the ID directly as a fallback
            userId = user.id;
          }
        }
        userName = user.name || schedule.userName || '';
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

    // Log the user ID for debugging
    console.log('Creating schedule with user ID:', userId, 'Type:', typeof userId);

    // Process the user ID to ensure it's a valid number
    let numericUserId: number;

    if (typeof userId === 'number') {
      // If it's already a number, use it directly
      numericUserId = userId;
    } else if (typeof userId === 'string') {
      // If it's a string, try to convert it to a number
      const parsedId = parseInt(userId);
      if (!isNaN(parsedId)) {
        numericUserId = parsedId;
      } else {
        // If conversion fails, log error and use a default value
        console.error('Could not convert user ID to number:', userId);
        toast.error('Invalid user ID format. Using default ID.');
        numericUserId = 1; // Use a default ID as fallback
      }
    } else {
      // If it's neither a number nor a string, use a default
      console.error('User ID is not a valid type:', typeof userId);
      toast.error('Invalid user ID. Using default ID.');
      numericUserId = 1; // Use a default ID as fallback
    }

    // Format the time values properly for PostgreSQL
    // The database expects a timestamp with time zone, so we need to combine the date and time
    const formattedDate = schedule.date || new Date().toISOString().split('T')[0];

    // Create properly formatted timestamps by combining date and time
    const formattedStartTime = `${formattedDate}T${schedule.startTime}:00`;
    const formattedEndTime = `${formattedDate}T${schedule.endTime}:00`;

    console.log('Formatted times:', {
      formattedDate,
      originalStartTime: schedule.startTime,
      formattedStartTime,
      originalEndTime: schedule.endTime,
      formattedEndTime
    });

    // Create the insert data object with the required user_id field and properly formatted times
    const insertData = {
      room_id: schedule.roomId,
      title: schedule.title,
      description: schedule.description,
      user_name: userName,
      date: formattedDate,
      start_time: formattedStartTime,
      end_time: formattedEndTime,
      user_id: numericUserId // Include the user_id field
    };

    console.log('Final insert data:', insertData);

    // Try using the supabase client first
    try {
      const { data, error } = await supabase
        .from('schedules')
        .insert(insertData)
        .select('*')
        .single();

      if (error) {
        console.error('Error creating schedule with supabase client:', error);
        throw error;
      }

      // Create an activity log entry for the new schedule
      try {
        // Get the room name
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('name')
          .eq('id', data.room_id)
          .single();

        if (roomError) {
          console.error('Error fetching room name for activity log:', roomError);
        } else {
          const roomName = roomData.name;
          const currentTime = new Date();
          const formattedTime = currentTime.toTimeString().split(' ')[0].substring(0, 5); // Format: HH:MM

          // Create the activity log
          await createActivityLog(
            data.room_id,
            roomName,
            data.user_id,
            data.user_name,
            data.date,
            formattedTime,
            'reserved',
            `Room reserved: ${data.title || 'No title'}`
          );
        }
      } catch (logError) {
        console.error('Failed to create activity log for new schedule:', logError);
        // Don't throw the error - we don't want to fail the schedule creation if logging fails
      }

      // Extract just the time part from the ISO timestamp
      let startTime = data.start_time;
      let endTime = data.end_time;

      // If the time is in ISO format (contains 'T'), extract just the time part (HH:MM)
      if (startTime && startTime.includes('T')) {
        startTime = startTime.split('T')[1].substring(0, 5);
      }

      if (endTime && endTime.includes('T')) {
        endTime = endTime.split('T')[1].substring(0, 5);
      }

      console.log('Extracted times:', {
        originalStart: data.start_time,
        extractedStart: startTime,
        originalEnd: data.end_time,
        extractedEnd: endTime
      });

      return {
        id: data.id.toString(),
        roomId: data.room_id,
        title: data.title || '',
        description: data.description || '',
        userId: data.user_id.toString(),
        userName: data.user_name || '',
        date: data.date || '',
        startTime: startTime,
        endTime: endTime
      };
    } catch (supabaseError) {
      // If the supabase client fails, try a direct fetch to the API
      console.log('Trying alternative method to create schedule...');

      // Create a direct fetch to the Supabase REST API
      const SUPABASE_URL = "https://crrucdgzyosmauckvczl.supabase.co";
      const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycnVjZGd6eW9zbWF1Y2t2Y3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQ4NzIsImV4cCI6MjA2MjIzMDg3Mn0.xNmWNSdTCl2KrvYAdZBAGAGPsl0RuSuiA5vcLoubqJ8";

      const response = await fetch(`${SUPABASE_URL}/rest/v1/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(insertData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Direct API request failed:', response.status, errorText);
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const createdSchedule = Array.isArray(data) && data.length > 0 ? data[0] : data;

      // Create an activity log entry for the new schedule
      try {
        // Get the room name
        const roomResponse = await fetch(`${SUPABASE_URL}/rest/v1/rooms?id=eq.${createdSchedule.room_id}&select=name`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        });

        if (roomResponse.ok) {
          const roomData = await roomResponse.json();
          if (roomData && roomData.length > 0) {
            const roomName = roomData[0].name;
            const currentTime = new Date();
            const formattedTime = currentTime.toTimeString().split(' ')[0].substring(0, 5); // Format: HH:MM

            // Create the activity log using direct API call
            const logResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/insert_activity_log`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
              },
              body: JSON.stringify({
                p_room_id: createdSchedule.room_id,
                p_room_name: roomName,
                p_user_id: createdSchedule.user_id,
                p_user_name: createdSchedule.user_name,
                p_date: createdSchedule.date,
                p_time: formattedTime,
                p_status: 'reserved',
                p_details: `Room reserved: ${createdSchedule.title || 'No title'}`
              })
            });

            if (!logResponse.ok) {
              console.error('Failed to create activity log via direct API:', await logResponse.text());
            }
          }
        }
      } catch (logError) {
        console.error('Failed to create activity log for new schedule (direct method):', logError);
        // Don't throw the error - we don't want to fail the schedule creation if logging fails
      }

      // Extract just the time part from the ISO timestamp
      let startTime = createdSchedule.start_time;
      let endTime = createdSchedule.end_time;

      // If the time is in ISO format (contains 'T'), extract just the time part (HH:MM)
      if (startTime && startTime.includes('T')) {
        startTime = startTime.split('T')[1].substring(0, 5);
      }

      if (endTime && endTime.includes('T')) {
        endTime = endTime.split('T')[1].substring(0, 5);
      }

      console.log('Extracted times (alternative method):', {
        originalStart: createdSchedule.start_time,
        extractedStart: startTime,
        originalEnd: createdSchedule.end_time,
        extractedEnd: endTime
      });

      return {
        id: createdSchedule.id.toString(),
        roomId: createdSchedule.room_id,
        title: createdSchedule.title || '',
        description: createdSchedule.description || '',
        userId: createdSchedule.user_id.toString(),
        userName: createdSchedule.user_name || '',
        date: createdSchedule.date || '',
        startTime: startTime,
        endTime: endTime
      };
    }
  } catch (error) {
    console.error('API request failed when creating schedule:', error);

    // Provide more specific error messages based on the error type
    if (error.code === '23503') {
      // Foreign key violation
      toast.error('Failed to create schedule: Invalid room or user reference');
    } else if (error.code === '23502') {
      // Not null violation
      toast.error('Failed to create schedule: Missing required field');
    } else if (error.code === '22P02') {
      // Invalid text representation (often a type conversion issue)
      toast.error('Failed to create schedule: Invalid data format');
    } else {
      // Generic error message
      toast.error(`Failed to create schedule: ${error.message || 'Unknown error'}`);
    }

    throw error;
  }
};

export const updateSchedule = async (id: number, scheduleData: Partial<Schedule>): Promise<Schedule> => {
  try {
    console.log('Update schedule input data:', scheduleData);

    const updateData: any = {};
    if (scheduleData.roomId !== undefined) updateData.room_id = scheduleData.roomId;
    if (scheduleData.title !== undefined) updateData.title = scheduleData.title;
    if (scheduleData.description !== undefined) updateData.description = scheduleData.description;
    if (scheduleData.date !== undefined) updateData.date = scheduleData.date;

    // Handle time formats
    if (scheduleData.startTime !== undefined) {
      // If startTime already contains 'T', it's already in ISO format
      if (scheduleData.startTime.includes('T')) {
        updateData.start_time = scheduleData.startTime;
      } else if (scheduleData.date) {
        // If we have a date, format as ISO
        updateData.start_time = `${scheduleData.date}T${scheduleData.startTime}:00`;
      } else {
        // Just use the time as is
        updateData.start_time = scheduleData.startTime;
      }
    }

    if (scheduleData.endTime !== undefined) {
      // If endTime already contains 'T', it's already in ISO format
      if (scheduleData.endTime.includes('T')) {
        updateData.end_time = scheduleData.endTime;
      } else if (scheduleData.date) {
        // If we have a date, format as ISO
        updateData.end_time = `${scheduleData.date}T${scheduleData.endTime}:00`;
      } else {
        // Just use the time as is
        updateData.end_time = scheduleData.endTime;
      }
    }

    console.log('Updating schedule with data:', updateData);

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

    // Extract just the time part from the ISO timestamp
    let startTime = data.start_time;
    let endTime = data.end_time;

    // If the time is in ISO format (contains 'T'), extract just the time part (HH:MM)
    if (startTime && startTime.includes('T')) {
      startTime = startTime.split('T')[1].substring(0, 5);
    }

    if (endTime && endTime.includes('T')) {
      endTime = endTime.split('T')[1].substring(0, 5);
    }

    console.log('Extracted times (update):', {
      originalStart: data.start_time,
      extractedStart: startTime,
      originalEnd: data.end_time,
      extractedEnd: endTime
    });

    return {
      id: data.id.toString(),
      roomId: data.room_id,
      title: data.title || '',
      description: data.description || '',
      userId: data.user_id.toString(),
      userName: data.user_name || '',
      date: data.date || '',
      startTime: startTime,
      endTime: endTime
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

// Create an activity log entry
export const createActivityLog = async (
  roomId: number,
  roomName: string,
  userId: number,
  userName: string,
  date: string,
  time: string,
  status: string,
  details: string
): Promise<number> => {
  try {
    console.log('Creating activity log entry:', {
      roomId, roomName, userId, userName, date, time, status, details
    });

    // Call the insert_activity_log RPC function
    const { data, error } = await supabase.rpc('insert_activity_log', {
      p_room_id: roomId,
      p_room_name: roomName,
      p_user_id: userId,
      p_user_name: userName,
      p_date: date,
      p_time: time,
      p_status: status,
      p_details: details
    });

    if (error) {
      console.error('Error creating activity log:', error);
      throw error;
    }

    console.log('Activity log created with ID:', data);
    return data;
  } catch (error) {
    console.error('Failed to create activity log:', error);
    // Don't throw the error - we don't want to fail the main operation if logging fails
    return -1;
  }
};
