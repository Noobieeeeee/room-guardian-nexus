
import { supabase } from '@/integrations/supabase/client';
import { Room, Schedule, ActivityLog } from './types';
import { toast } from 'sonner';

// Example API router utility functions for direct database access
// These can be used as an alternative approach to the main API functions

// Activity Log API using RPC
export async function logActivity(activity: Omit<ActivityLog, 'id'>): Promise<boolean> {
  try {
    // Check if table exists first
    const { data: tableExists, error: checkError } = await supabase.rpc(
      'check_table_exists', 
      { table_name: 'activity_logs' }
    );
    
    if (checkError || !tableExists) {
      console.error('Activity logs table may not exist:', checkError);
      return false;
    }
    
    // Use RPC function to insert log
    const { data, error } = await supabase.rpc(
      'insert_activity_log',
      {
        p_room_id: activity.roomId,
        p_room_name: activity.roomName,
        p_user_id: activity.userId ? parseInt(activity.userId) : null,
        p_user_name: activity.userName,
        p_date: activity.date,
        p_time: activity.time,
        p_status: activity.status,
        p_details: activity.details || ''
      }
    );
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error logging activity:', error);
    return false;
  }
}

// Additional API router methods can be added here as needed
