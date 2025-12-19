import { createUser } from '@/lib/api';
import { User } from '@/lib/types';

/**
 * Debug function to test the createUser API function directly
 */
export async function debugCreateUser(): Promise<void> {
  try {
    console.log('🔍 Starting createUser API function debug...');
    
    // Test creating a user with the same parameters that would come from the form
    const testUserData = {
      name: 'Test User',
      email: 'test.user@example.com',
      role: 'guest' as const,
      password: 'password123'
    };
    
    console.log('🧪 Test: Calling createUser API function with:', testUserData);
    
    const result = await createUser(testUserData);
    console.log('✅ Test PASSED - User created successfully:', result);
    
    // Clean up - delete the test user
    // We would need to implement a delete function for this, but for now we'll just log
    console.log('📝 Note: Test user should be manually cleaned up from the database');
    
  } catch (error: any) {
    console.error('❌ Test FAILED - Error creating user:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
  }
}