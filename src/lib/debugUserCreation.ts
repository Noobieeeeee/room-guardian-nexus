import { supabase } from '@/integrations/supabase/client';
import { User } from '@/lib/types';

/**
 * Debug function to test user creation functionality
 */
export async function debugUserCreation(): Promise<void> {
  try {
    console.log('🔍 Starting user creation debug...');
    
    // Test 1: Check if we can connect to the users table
    console.log('🧪 Test 1: Checking users table connectivity...');
    const { data: usersCount, error: usersCountError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (usersCountError) {
      console.error('❌ Test 1 FAILED - Cannot connect to users table:', usersCountError);
      return;
    }
    
    console.log('✅ Test 1 PASSED - Connected to users table. Record count:', usersCount?.count);
    
    // Test 2: Try to create a test user
    console.log('🧪 Test 2: Creating a test user...');
    const testUser = {
      username: 'debug_test_user',
      email: 'debug_test@example.com',
      password_hash: 'password',
      role: 'guest'
    };
    
    const { data: createdUser, error: createUserError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();
    
    if (createUserError) {
      console.error('❌ Test 2 FAILED - Cannot create user:', createUserError);
      console.error('Error details:', {
        message: createUserError.message,
        code: createUserError.code,
        details: createUserError.details,
        hint: createUserError.hint
      });
    } else {
      console.log('✅ Test 2 PASSED - Created user:', createdUser);
      
      // Clean up the test user
      if (createdUser?.id) {
        await supabase
          .from('users')
          .delete()
          .eq('id', createdUser.id);
        console.log('🧹 Cleaned up test user');
      }
    }
    
    // Test 3: Try to fetch existing users
    console.log('🧪 Test 3: Fetching existing users...');
    const { data: existingUsers, error: fetchUsersError } = await supabase
      .from('users')
      .select('*')
      .limit(3);
    
    if (fetchUsersError) {
      console.error('❌ Test 3 FAILED - Cannot fetch users:', fetchUsersError);
    } else {
      console.log('✅ Test 3 PASSED - Fetched users:', existingUsers);
    }
    
    console.log('🎉 User creation debug tests completed!');
    
  } catch (error) {
    console.error('💥 Unexpected error during user creation debug:', error);
  }
}