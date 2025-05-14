
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return null;
      }

      return {
        id: userData.id,
        name: userData.username, // Use username field as name
        email: userData.email,
        role: userData.role as 'admin' | 'faculty' | 'guest'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    toast.error(error.message || 'Failed to sign in');
    return null;
  }
}

/**
 * Signs out the current user
 */
export async function signOut(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    
    // Remove user from local storage
    localStorage.removeItem('currentUser');
    
    // Clean up any other auth-related items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase.auth')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Sign out error:', error);
    toast.error(error.message || 'Failed to sign out');
  }
}

/**
 * Gets the current session
 */
export async function getSession(): Promise<AuthSession> {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    if (data?.session) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return { user: null, session: data.session };
      }

      const user: User = {
        id: userData.id,
        name: userData.username, // Use username field as name
        email: userData.email,
        role: userData.role as 'admin' | 'faculty' | 'guest'
      };

      return { user, session: data.session };
    }
    
    return { user: null, session: null };
  } catch (error) {
    console.error('Session error:', error);
    return { user: null, session: null };
  }
}

/**
 * Initializes auth state
 */
export function initAuth(callback: (user: User | null) => void): (() => void) {
  // Check for existing session
  getSession().then(({ user }) => {
    callback(user);
  });
  
  // Listen for auth changes
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      // Defer fetching user data to prevent potential deadlocks
      setTimeout(async () => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          callback(null);
          return;
        }

        const user: User = {
          id: data.id,
          name: data.username, // Use username field as name
          email: data.email,
          role: data.role as 'admin' | 'faculty' | 'guest'
        };
        
        callback(user);
      }, 0);
    } else if (event === 'SIGNED_OUT') {
      callback(null);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}
