'use client';

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback,
  useMemo 
} from 'react';
import { useRouter } from 'next/navigation';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

// Helper function to log auth state changes
function logAuthState(state: string, data?: any) {
  if (typeof window !== 'undefined') {
    console.log(`[Auth] ${state}`, data || '');
  }
}

// Create the auth context
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<Session | undefined>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const updateSession = useCallback((session: Session | null) => {
    console.log('[AuthContext] Updating session:', {
      hasSession: !!session,
      user: session?.user?.email,
      expiresAt: session?.expires_at,
      currentPath: typeof window !== 'undefined' ? window.location.pathname : 'server',
      currentTime: new Date().toISOString()
    });

    setSession(session);
    setUser(session?.user ?? null);
    
    // Log the session update
    logAuthState('Session updated', { 
      hasSession: !!session,
      user: session?.user?.email,
      expiresAt: session?.expires_at
    });
  }, []);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    console.log('[AuthContext] Initializing auth state');
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthContext] Error getting initial session:', error);
          logAuthState('Error getting session', error);
          return;
        }
        
        console.log('[AuthContext] Initial session:', {
          hasSession: !!session,
          user: session?.user?.email,
          expiresAt: session?.expires_at
        });
        
        logAuthState('Initial session', session);
        updateSession(session);
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
      } finally {
        console.log('[AuthContext] Auth initialization complete');
        // Always set loading to false when done, whether successful or not
        setIsLoading(false);
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[AuthContext] Auth state changed: ${event}`, { 
          hasSession: !!session,
          user: session?.user?.email,
          expiresAt: session?.expires_at,
          currentPath: typeof window !== 'undefined' ? window.location.pathname : 'server'
        });
        
        // Update session state
        updateSession(session);
        
        // Handle specific auth events
        if (event === 'SIGNED_IN' && session) {
          console.log('[AuthContext] User signed in:', session.user.email);
          // Only redirect if we're on the login or signup page
          if (typeof window !== 'undefined' && ['/login', '/signup'].includes(window.location.pathname)) {
            const urlParams = new URLSearchParams(window.location.search);
            const redirectTo = urlParams.get('redirect') || '/dashboard';
            console.log('[AuthContext] Redirecting after sign in to:', redirectTo);
            // Use router.push for client-side navigation instead of window.location
            router.push(redirectTo);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] User signed out');
          if (typeof window !== 'undefined' && !['/login', '/signup', '/'].includes(window.location.pathname)) {
            console.log('[AuthContext] Redirecting to login');
            // Use router.push for client-side navigation
            router.push('/login');
          }
        }
      }
    );

    initializeAuth();
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [updateSession]);

  const signIn = async (email: string, password: string) => {
    if (typeof window === 'undefined') return;
    
    logAuthState('Signing in', { email });
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        logAuthState('Sign in error', error);
        // Enhance error with more context
        const enhancedError = new Error(error.message);
        enhancedError.name = error.name;
        if ('status' in error) {
          (enhancedError as any).status = (error as any).status;
        }
        throw enhancedError;
      }
      
      if (!data.session) {
        logAuthState('No session after sign in', data);
        throw new Error('No session was created after sign in');
      }
      
      // Update the session state
      updateSession(data.session);
      logAuthState('Sign in successful', { 
        user: data.user?.email,
        session: data.session.expires_at
      });
      
      // Return the session data
      return data.session;
      
    } catch (error) {
      logAuthState('Sign in failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    if (typeof window === 'undefined') return { error: null };
    
    logAuthState('Signing up', { email });
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        logAuthState('Sign up error', error);
        return { error };
      }
      
      logAuthState('Sign up successful - check your email for confirmation');
      return { error: null };
      
    } catch (error) {
      logAuthState('Sign up failed', error);
      return { 
        error: error instanceof Error ? error : new Error('Sign up failed') 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    logAuthState('Signing out');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logAuthState('Sign out error', error);
        throw error;
      }
      logAuthState('Sign out successful');
      router.push('/login');
      router.refresh();
    } catch (error) {
      logAuthState('Sign out failed', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}