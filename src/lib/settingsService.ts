
import { supabase } from '@/integrations/supabase/client';

export interface SystemSettings {
  sensor_threshold: number;
  email_notifications: boolean;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching system settings:', error);
      // Return default values if no settings found
      return {
        sensor_threshold: 0.5,
        email_notifications: true
      };
    }

    return {
      sensor_threshold: data.sensor_threshold || 0.5,
      email_notifications: data.email_notifications !== false
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
    // First, try to get existing settings
    const { data: existing } = await supabase
      .from('system_settings')
      .select('id')
      .single();

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('system_settings')
        .update(settings)
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating system settings:', error);
        return false;
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('system_settings')
        .insert([{
          sensor_threshold: settings.sensor_threshold || 0.5,
          email_notifications: settings.email_notifications !== false
        }]);

      if (error) {
        console.error('Error inserting system settings:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in updateSystemSettings:', error);
    return false;
  }
}
