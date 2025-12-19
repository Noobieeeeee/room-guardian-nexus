
import { supabase } from '@/integrations/supabase/client';

/**
 * Check if the activity_logs table exists
 */
export async function setupActivityLogsTable(): Promise<boolean> {
  try {
    // Create check_table_exists function if it doesn't exist
    const { error: functionError } = await supabase.rpc('create_check_table_exists_function');
    
    if (functionError) {
      console.error('Error creating check_table_exists function:', functionError);
      // Continue anyway, as function may already exist
    }

    // Create the activity_logs table if it doesn't exist
    const { error: tableError } = await supabase.rpc('create_activity_logs_table');
    
    if (tableError) {
      console.error('Error creating activity_logs table:', tableError);
      return false;
    }
    
    return true;
  } catch (error: any) {
    console.error('Error during activity logs setup:', error);
    return false;
  }
}
