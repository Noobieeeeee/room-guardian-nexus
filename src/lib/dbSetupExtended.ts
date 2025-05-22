
import { supabase } from '@/integrations/supabase/client';

export async function setupSystemSettingsTable() {
  try {
    // Check if the system_settings table exists
    const { data: tableExists, error: checkError } = await supabase.rpc('check_table_exists', {
      table_name: 'system_settings',
    });

    if (checkError) {
      console.error('Error checking if system_settings table exists:', checkError);
      return false;
    }

    // Create table if it doesn't exist
    if (!tableExists) {
      const { error: createError } = await supabase.rpc('create_system_settings_table');
      
      if (createError) {
        console.error('Error creating system_settings table:', createError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error setting up system settings table:', error);
    return false;
  }
}

export async function setupSystemSettingsRPC() {
  try {
    // Create RPC function for updating system settings
    const { error } = await supabase.rpc('create_update_settings_function');
    
    if (error) {
      console.error('Error creating update_system_settings function:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up system settings RPC:', error);
    return false;
  }
}
