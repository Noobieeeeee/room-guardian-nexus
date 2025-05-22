
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define types for system settings
export interface SystemSettings {
  sensorThreshold: number;
}

const SETTINGS_TABLE = 'system_settings';
const DEFAULT_SETTINGS: SystemSettings = {
  sensorThreshold: 0.5,
};

// Get system settings from Supabase
export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .select('*')
      .eq('id', 1)
      .single();

    if (error) throw error;
    
    // If no settings found, return defaults
    if (!data) return DEFAULT_SETTINGS;
    
    return {
      sensorThreshold: data.sensor_threshold,
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
    
    const { error } = await supabase
      .from(SETTINGS_TABLE)
      .upsert(
        { 
          id: 1, 
          sensor_threshold: settings.sensorThreshold,
        },
        { onConflict: 'id' }
      );

    if (error) throw error;
    
    toast.success('System settings updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating system settings:', error);
    toast.error('Failed to update system settings');
    return false;
  }
}
