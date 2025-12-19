import { supabase } from '@/integrations/supabase/client';
import { Room, Schedule, User } from '@/lib/types';

/**
 * Debug function to test database connectivity and CRUD operations
 */
export async function debugDatabase(): Promise<void> {
  try {
    console.log('🔍 Starting database debug...');
    
    // Test 1: Check if we can connect to the database
    console.log('🧪 Test 1: Checking database connectivity...');
    const { data: roomsCount, error: roomsCountError } = await supabase
      .from('rooms')
      .select('count', { count: 'exact', head: true });
    
    if (roomsCountError) {
      console.error('❌ Test 1 FAILED - Cannot connect to rooms table:', roomsCountError);
      return;
    }
    
    console.log('✅ Test 1 PASSED - Connected to rooms table. Record count:', roomsCount?.count);
    
    // Test 2: Check users table
    console.log('🧪 Test 2: Checking users table...');
    const { data: usersCount, error: usersCountError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (usersCountError) {
      console.error('❌ Test 2 FAILED - Cannot connect to users table:', usersCountError);
      return;
    }
    
    console.log('✅ Test 2 PASSED - Connected to users table. Record count:', usersCount?.count);
    
    // Test 3: Check schedules table
    console.log('🧪 Test 3: Checking schedules table...');
    const { data: schedulesCount, error: schedulesCountError } = await supabase
      .from('schedules')
      .select('count', { count: 'exact', head: true });
    
    if (schedulesCountError) {
      console.error('❌ Test 3 FAILED - Cannot connect to schedules table:', schedulesCountError);
      return;
    }
    
    console.log('✅ Test 3 PASSED - Connected to schedules table. Record count:', schedulesCount?.count);
    
    // Test 4: Try to fetch sample data
    console.log('🧪 Test 4: Fetching sample data...');
    const { data: sampleRooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .limit(3);
    
    if (roomsError) {
      console.error('❌ Test 4 FAILED - Cannot fetch rooms:', roomsError);
      return;
    }
    
    console.log('✅ Test 4 PASSED - Fetched rooms:', sampleRooms);
    
    // Test 5: Try to create a test room
    console.log('🧪 Test 5: Creating a test room...');
    const testRoom = {
      name: 'Debug Test Room',
      status: 'available',
      current_draw: 0.0
    };
    
    const { data: createdRoom, error: createRoomError } = await supabase
      .from('rooms')
      .insert(testRoom)
      .select('*')
      .single();
    
    if (createRoomError) {
      console.error('❌ Test 5 FAILED - Cannot create room:', createRoomError);
    } else {
      console.log('✅ Test 5 PASSED - Created room:', createdRoom);
      
      // Clean up the test room
      if (createdRoom?.id) {
        await supabase
          .from('rooms')
          .delete()
          .eq('id', createdRoom.id);
        console.log('🧹 Cleaned up test room');
      }
    }
    
    // Test 6: Try to create a test schedule
    console.log('🧪 Test 6: Creating a test schedule...');
    
    // First, get a user ID to use
    const { data: users, error: getUsersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (getUsersError || !users || users.length === 0) {
      console.error('⚠️  Could not get user for test schedule:', getUsersError);
    } else {
      // Get a room ID to use
      const { data: rooms, error: getRoomsError } = await supabase
        .from('rooms')
        .select('id')
        .limit(1);
      
      if (getRoomsError || !rooms || rooms.length === 0) {
        console.error('⚠️  Could not get room for test schedule:', getRoomsError);
      } else {
        const testSchedule = {
          room_id: rooms[0].id,
          title: 'Debug Test Schedule',
          description: 'Test schedule for debugging',
          user_id: users[0].id,
          user_name: 'Debug User',
          date: new Date().toISOString().split('T')[0],
          start_time: '09:00',
          end_time: '10:00'
        };
        
        const { data: createdSchedule, error: createScheduleError } = await supabase
          .from('schedules')
          .insert(testSchedule)
          .select('*')
          .single();
        
        if (createScheduleError) {
          console.error('❌ Test 6 FAILED - Cannot create schedule:', createScheduleError);
        } else {
          console.log('✅ Test 6 PASSED - Created schedule:', createdSchedule);
          
          // Clean up the test schedule
          if (createdSchedule?.id) {
            await supabase
              .from('schedules')
              .delete()
              .eq('id', createdSchedule.id);
            console.log('🧹 Cleaned up test schedule');
          }
        }
      }
    }
    
    console.log('🎉 All database debug tests completed!');
    
  } catch (error) {
    console.error('💥 Unexpected error during database debug:', error);
  }
}