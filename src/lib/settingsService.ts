
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define types for system settings
export interface SystemSettings {
  sensorThreshold: number;
}

const DEFAULT_SETTINGS: SystemSettings = {
  sensorThreshold: 0.5,
};

// Get system settings from Supabase
export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    // Use the RPC function
    const { data, error } = await supabase
      .rpc('get_system_settings');

    if (error) throw error;
    
    // If no settings found, return defaults
    if (!data || data.length === 0) return DEFAULT_SETTINGS;
    
    return {
      sensorThreshold: data[0].sensor_threshold as number,
    };
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return DEFAULT_SETTINGS;
  }
}

// Update system settings in Supabase
export async function updateSystemSettings(settings: SystemSettings): Promise<boolean> {
  try {
    // Validate sensor threshold value
    if (settings.sensorThreshold < 0.1 || settings.sensorThreshold > 5) {
      toast.error('Sensor threshold must be between 0.1 and 5 amperes');
      return false;
    }
    
    // Use the RPC function
    const { data, error } = await supabase
      .rpc('update_system_settings', {
        p_sensor_threshold: settings.sensorThreshold
      });

    if (error) throw error;
    
    if (data === true) {
      toast.success('System settings updated successfully');
      return true;
    } else {
      toast.error('Failed to update system settings');
      return false;
    }
  } catch (error) {
    console.error('Error updating system settings:', error);
    toast.error('Failed to update system settings');
    return false;
  }
}
