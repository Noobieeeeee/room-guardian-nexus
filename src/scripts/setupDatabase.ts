
import { supabase } from '@/integrations/supabase/client';
import { mockRooms, mockUsers } from '../lib/mockData';
import { UserRole } from '../lib/types';

interface CreateUserParams {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

/**
 * Script to help setup database with initial data.
 * Note: This should be run once manually through the browser console or a script runner.
 */

async function createUser({ email, password, name, role }: CreateUserParams): Promise<void> {
  try {
    // Sign up user using Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role
        }
      }
    });

    if (authError) {
      throw authError;
    }

    console.log(`User created: ${email} with role ${role}`);
  } catch (error) {
    console.error(`Error creating user ${email}:`, error);
  }
}

async function createRooms(): Promise<void> {
  try {
    // Check if rooms already exist
    const { count, error: countError } = await supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    if (count && count > 0) {
      console.log(`${count} rooms already exist, skipping room creation`);
      return;
    }
    
    // Insert rooms
    const { error } = await supabase
      .from('rooms')
      .insert(
        mockRooms.map(room => ({
          name: room.name,
          status: room.status,
          current_draw: room.currentDraw,
          last_updated: room.lastUpdated
        }))
      );
    
    if (error) throw error;
    
    console.log(`${mockRooms.length} rooms created successfully`);
  } catch (error) {
    console.error('Error creating rooms:', error);
  }
}

export async function setupDatabase(): Promise<void> {
  console.log('Starting database setup...');
  
  try {
    // Create demo users
    await Promise.all([
      createUser({
        email: 'admin@example.com',
        password: 'password',
        name: 'Admin User',
        role: 'admin'
      }),
      createUser({
        email: 'faculty@example.com',
        password: 'password',
        name: 'Faculty User',
        role: 'faculty'
      }),
      createUser({
        email: 'guest@example.com',
        password: 'password',
        name: 'Guest User',
        role: 'guest'
      })
    ]);
    
    // Create rooms
    await createRooms();
    
    console.log('Database setup completed successfully!');
    console.log('You can now log in with:');
    console.log('- admin@example.com / password (Admin role)');
    console.log('- faculty@example.com / password (Faculty role)');
    console.log('- guest@example.com / password (Guest role)');
  } catch (error) {
    console.error('Database setup failed:', error);
  }
}

// Uncomment and run in browser console:
// setupDatabase().then(() => console.log('Setup complete'));
