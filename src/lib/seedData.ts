
import { supabase } from '@/integrations/supabase/client';
import { mockRooms, mockUsers } from './mockData';

export async function seedDatabase(): Promise<boolean> {
  try {
    // First check if we need to seed
    const { count: roomCount, error: countError } = await supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      throw countError;
    }
    
    // Only seed if no rooms exist
    if (roomCount === 0) {
      console.log('Seeding database with initial data...');
      
      // Insert rooms
      const { error: roomsError } = await supabase
        .from('rooms')
        .insert(
          mockRooms.map(room => ({
            name: room.name,
            status: room.status,
            current_draw: room.currentDraw,
            last_updated: room.lastUpdated
          }))
        );
      
      if (roomsError) {
        throw roomsError;
      }
      
      console.log('Database seeded successfully');
      return true;
    }
    
    console.log('Database already contains data, skipping seed');
    return false;
  } catch (error) {
    console.error('Error seeding database:', error);
    return false;
  }
}
