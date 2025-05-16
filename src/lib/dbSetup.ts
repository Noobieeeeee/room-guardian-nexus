
import { supabase } from '@/integrations/supabase/client';

/**
 * Check if the activity_logs table exists
 */
export async function setupActivityLogsTable(): Promise<boolean> {
  try {
    // Create check_table_exists function if it doesn't exist
    await supabase.rpc('create_check_table_exists_function')
      .catch((err) => {
        // Function may already exist, ignore error
        console.log('Function may already exist:', err);
      });

    // Create the activity_logs table if it doesn't exist
    const { data, error } = await supabase.rpc('create_activity_logs_table');
    
    if (error) {
      console.error('Error creating activity_logs table:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error during activity logs setup:', error);
    return false;
  }
}
