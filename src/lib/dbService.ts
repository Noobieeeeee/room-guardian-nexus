
import { supabase } from '@/integrations/supabase/client';
import { seedDatabase } from './seedData';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

let isInitialized = false;

export async function initializeDatabase(): Promise<boolean> {
  if (isInitialized) return true;

  try {
    // Check connection to Supabase
    const { data, error } = await supabase.from('rooms').select('count', { count: 'exact', head: true });

    if (error) {
      if (error.message.includes('does not exist') || error.code === 'PGRST116') {
        // Table doesn't exist yet - this could happen if migrations haven't been run
        console.warn('Database tables not found. Please ensure migrations have been applied.');
        toast.error('Database setup required. Please contact administrator.');
        return false;
      }
      throw error;
    }

    console.info("Database connection successful");

    // Check if schedules table is accessible
    const schedulesTableOk = await checkSchedulesTable();
    if (!schedulesTableOk) {
      console.warn('Schedules table is not accessible. Some features may not work properly.');
      toast.error('Error connecting to schedules table. Room booking may not work.');
    }

    // Seed database with initial data if needed
    await seedDatabase();

    isInitialized = true;
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    toast.error('Failed to connect to the database. Please try again later.');
    return false;
  }
}

export function resetDatabaseState(): void {
  isInitialized = false;
}

/**
 * Check if the schedules table exists and is accessible
 */
export async function checkSchedulesTable(): Promise<boolean> {
  try {
    console.log('Checking schedules table...');

    // Try to directly access the schedules table with a simple query
    const { data, error } = await supabase
      .from('schedules')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error accessing schedules table:', error);

      // If there's an error, try to create a direct connection to verify the issue
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Create a new client with minimal configuration
      const directClient = createClient(SUPABASE_URL, SUPABASE_KEY);

      // Try the same query with the direct client
      const directResult = await directClient
        .from('schedules')
        .select('id')
        .limit(1);

      if (directResult.error) {
        console.error('Direct client also failed to access schedules table:', directResult.error);
        return false;
      } else {
        console.log('Direct client successfully accessed schedules table. Issue is with the main client configuration.');
        return true;
      }
    }

    console.log('Schedules table exists and is accessible');
    return true;
  } catch (error) {
    console.error('Error checking schedules table:', error);
    return false;
  }
}
