'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import api from '@/lib/api';
import logger from '@/utils/logger';
import { useRouter } from 'next/navigation';
import { fetchMyOnboarding } from '@/features/onboarding/api';
import { toast } from 'sonner';

interface User {
  id: string; // backend returns UUID string
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing session on initial load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        logger.debug('Auth: Checking stored token:', storedToken ? 'Present' : 'Missing');
        
        if (storedToken) {
          // Verify token and fetch user data
          // Use shared API client which attaches Authorization from localStorage
          logger.debug('Auth: Verifying token with backend...');
          const userData = await api.get<User>('/users/me');
          
          logger.debug('Auth: Token verified, user data:', userData);
          setUser(userData);
          setToken(storedToken);

          // Check onboarding status and redirect if not completed
          try {
            const ob = await fetchMyOnboarding();
            if (ob && ob.completed === false) {
              // Avoid redirect loop if already on onboarding
              if (window.location.pathname !== '/onboarding') {
                router.push('/onboarding');
              }
            }
          } catch (e) {
            // Non-blocking: onboarding may not exist yet or have compatibility issues
            // Don't redirect to onboarding - let user access the app normally
            logger.warn('Onboarding check failed, continuing without redirect', e);
          }
        } else {
          logger.debug('Auth: No stored token found');
        }
      } catch (error) {
        logger.error('Error initializing auth', error);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      logger.debug('Attempting login', { email });
      const formData = new URLSearchParams({
        username: email,
        password: password,
        grant_type: 'password',
        scope: '',
        client_id: '',
        client_secret: '',
      });
      
      logger.debug('Sending login request');
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        logger.warn('Login request timeout, aborting...');
        controller.abort();
      }, 10000); // 10 second timeout
      
      try {
        // Canonical v1 token endpoint
        const tokenResponse = await api.post<{ access_token: string }>(
          '/login/access-token',
          formData.toString(),
          { 
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeoutMs: 10000, // 10 second timeout
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        logger.debug('Login successful, token received:', tokenResponse.access_token ? 'Present' : 'Missing');
        
        // Get user data with proper headers
        logger.debug('Fetching user data with token');
        localStorage.setItem('token', tokenResponse.access_token);
        logger.debug('Token stored in localStorage');
        
        const userData = await api.get<User>('/users/me');
        logger.debug('User data fetched:', userData);
        
        // Update state and storage
        setUser(userData);
        setToken(tokenResponse.access_token);
        toast.success('Signed in successfully');
        
        // After login, check onboarding and route accordingly
        try {
          const ob = await fetchMyOnboarding();
          if (ob && ob.completed === false) {
            router.push('/onboarding');
          }
        } catch (e) {
          // If onboarding not found, go to onboarding to start
          router.push('/onboarding');
        }
        
        // Return success status - let the component handle redirection
        return true;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      logger.error('Login error', error);
      // Map common failure cases to friendly messages
      const err: any = error || {};
      const status = err.status as number | undefined;
      const detail = err?.data?.detail || err?.message || 'Request failed';
      const validation = Array.isArray(err?.data?.errors) ? err.data.errors : null;
      let message = detail;
      if (status === 400) {
        // FastAPI returns 400 for incorrect credentials
        message = 'Incorrect email or password.';
      } else if (status === 401) {
        message = 'Unauthorized. Please check your credentials.';
      } else if (status === 403) {
        message = 'Forbidden. CSRF or permission issue.';
      } else if (status === 422 && validation) {
        const first = validation[0];
        const loc = first?.loc?.join('.') || 'request';
        const msg = first?.msg || 'Validation error';
        message = `Validation error on ${loc}: ${msg}`;
      } else if (status === 0 || status === undefined) {
        message = 'Network error. Is the API running at NEXT_PUBLIC_API_URL?';
      }
      toast.error(message);
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    // Call public registration endpoint
    const payload = { email, password, full_name: fullName } as any;
    await api.post('/register', payload);
    toast.success('Account created successfully');
    // Try auto-login to streamline onboarding
    try {
      const ok = await login(email, password);
      if (ok) {
        // login() will route to onboarding if not completed
        return;
      }
    } catch (_) {
      // Fall through to manual login route
    }
    // If auto-login fails, move user to login page
    router.push('/login');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
