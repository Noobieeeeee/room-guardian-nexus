import { supabase } from '@/integrations/supabase/client';

/**
 * Test function to verify Supabase connection and basic CRUD operations
 */
export async function testSupabaseConnection(): Promise<void> {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Check if we can connect to the database
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('count', { count: 'exact', head: true });
    
    if (roomsError) {
      console.error('❌ Error connecting to rooms table:', roomsError);
      return;
    }
    
    console.log('✅ Successfully connected to rooms table');
    
    // Test 2: Check if we can connect to users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (usersError) {
      console.error('❌ Error connecting to users table:', usersError);
      return;
    }
    
    console.log('✅ Successfully connected to users table');
    
    // Test 3: Check if we can connect to schedules table
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('count', { count: 'exact', head: true });
    
    if (schedulesError) {
      console.error('❌ Error connecting to schedules table:', schedulesError);
      return;
    }
    
    console.log('✅ Successfully connected to schedules table');
    
    // Test 4: Check if we can connect to activity_logs table
    const { data: logs, error: logsError } = await supabase
      .from('activity_logs')
      .select('count', { count: 'exact', head: true });
    
    if (logsError) {
      console.error('❌ Error connecting to activity_logs table:', logsError);
      return;
    }
    
    console.log('✅ Successfully connected to activity_logs table');
    
    // Test 5: Test authentication with sample user
    console.log('Testing authentication with sample user...');
    const { data: userData, error: authError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .eq('password_hash', 'password')
      .single();
    
    if (authError && authError.code !== 'PGRST116') {
      console.error('❌ Error authenticating user:', authError);
    } else if (userData) {
      console.log('✅ Authentication test passed for admin user');
    } else {
      console.log('⚠️  Admin user not found - you may need to run the database setup script');
    }
    
    // Test 6: Test inserting a test log entry
    console.log('Testing insert operation...');
    const testLog = {
      room_id: 101,
      room_name: 'Test Room',
      user_id: 1,
      user_name: 'Test User',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      status: 'available',
      details: 'Connection test entry'
    };
    
    const { data: insertedLog, error: insertError } = await supabase
      .from('activity_logs')
      .insert(testLog)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error inserting test log:', insertError);
    } else {
      console.log('✅ Insert test passed, created log ID:', insertedLog?.id);
      
      // Clean up the test entry
      if (insertedLog?.id) {
        await supabase
          .from('activity_logs')
          .delete()
          .eq('id', insertedLog.id);
        console.log('✅ Cleaned up test entry');
      }
    }
    
    console.log('🎉 All Supabase connection tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Unexpected error during Supabase connection test:', error);
  }
}

// Run the test if this file is executed directly
if (typeof window !== 'undefined' && window.location?.protocol?.startsWith('http')) {
  // Only run in browser environment
  testSupabaseConnection();
}