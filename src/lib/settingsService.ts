
import { supabase } from '@/integrations/supabase/client';

export interface SystemSettings {
  sensor_threshold: number;
  email_notifications: boolean;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const { data, error } = await supabase
      .rpc('get_system_settings');

    if (error) {
      console.error('Error fetching system settings:', error);
      // Return default values if no settings found
      return {
        sensor_threshold: 0.5,
        email_notifications: true
      };
    }

    // RPC returns an array, so get the first item
    const settings = data?.[0];
    
    return {
      sensor_threshold: settings?.sensor_threshold || 0.5,
      email_notifications: settings?.email_notifications !== false
    };
  } catch (error) {
    console.error('Error in getSystemSettings:', error);
    return {
      sensor_threshold: 0.5,
      email_notifications: true
    };
  }
}

export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('update_system_settings', {
        p_sensor_threshold: settings.sensor_threshold,
        p_email_notifications: settings.email_notifications
      });

    if (error) {
      console.error('Error updating system settings:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in updateSystemSettings:', error);
    return false;
  }
}
