
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/lib/types';
import { toast } from 'sonner';

export type AuthSession = {
  user: User | null;
  session: any | null;
};

/**
 * Signs in a user with email and password
 */
export async function signIn(email: string, password: string): Promise<User | null> {
  try {
    console.info('Attempting sign in for:', email);
    
    // Get user by email and password (direct DB query since we don't use Supabase Auth)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password_hash', password)
      .single();

    if (error) {
      console.error('Authentication error:', error);
      toast.error('Invalid email or password');
      return null;
    }

    if (data) {
      console.info('User authenticated successfully:', data.username);
      
      const user: User = {
        id: data.id.toString(), // Convert numeric ID to string
        name: data.username,
        email: data.email,
        role: data.role as 'admin' | 'faculty' | 'guest'
      };
      
      // Store user in localStorage for persistence
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      return user;
    }
    
    toast.error('Invalid email or password');
    return null;
  } catch (error: any) {
    console.error('Authentication error:', error);
    toast.error(error.message || 'Failed to sign in');
    return null;
  }
}

/**
 * Signs out the current user
 */
export async function signOut(): Promise<boolean> {
  try {
    console.info('Signing out user');
    
    // Remove user from local storage
    localStorage.removeItem('currentUser');
    
    // Clean up any other auth-related items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase.auth')) {
        localStorage.removeItem(key);
      }
    });

    return true;
  } catch (error: any) {
    console.error('Sign out error:', error);
    toast.error(error.message || 'Failed to sign out');
    return false;
  }
}

/**
 * Gets the current session
 */
export async function getSession(): Promise<AuthSession> {
  try {
    // Check localStorage for user
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedUser) {
      const user = JSON.parse(storedUser);
      console.info('Retrieved user session from localStorage:', user.name);
      return { user, session: {} }; // Return mock session
    }
    
    console.info('No active user session found');
    return { user: null, session: null };
  } catch (error: any) {
    console.error('Session error:', error);
    return { user: null, session: null };
  }
}

/**
 * Initializes auth state
 */
export function initAuth(callback: (user: User | null) => void): (() => void) {
  console.info('Initializing authentication state');
  
  // Check for existing session
  getSession().then(({ user }) => {
    console.info('User from auth initialization:', user?.name || 'No user');
    callback(user);
  });
  
  // No need for auth state change listener since we're using localStorage directly
  
  return () => {
    // Cleanup function
    console.info('Auth cleanup function called');
  };
}
