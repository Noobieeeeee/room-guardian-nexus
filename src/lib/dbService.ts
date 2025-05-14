
import { supabase } from '@/integrations/supabase/client';
import { seedDatabase } from './seedData';
import { toast } from 'sonner';

let isInitialized = false;

export async function initializeDatabase(): Promise<boolean> {
  if (isInitialized) return true;
  
  try {
    // Check connection to Supabase
    const { error } = await supabase.from('rooms').select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Table doesn't exist yet - this could happen if migrations haven't been run
        console.warn('Database tables not found. Please ensure migrations have been applied.');
        toast.error('Database setup required. Please contact administrator.');
        return false;
      }
      throw error;
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
