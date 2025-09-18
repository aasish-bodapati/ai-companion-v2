'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import api from '@/lib/api';
// Logger removed for Milestone 1 simplicity
const logger = {
  info: (msg: string, ...args: any[]) => console.log(msg, ...args),
  error: (msg: string, ...args: any[]) => console.error(msg, ...args),
  warn: (msg: string, ...args: any[]) => console.warn(msg, ...args),
  debug: (msg: string, ...args: any[]) => console.debug(msg, ...args),
};
import { useRouter } from 'next/navigation';

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

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
  testMode?: boolean;
}

export const AuthProvider = ({ children, initialUser, testMode = false }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  const router = useRouter();

  // Check for existing session on initial load
  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (initialized.current) {
      return;
    }
    initialized.current = true;
    
    // Setup test user if in test mode
    if (testMode) {
      // Check if user has explicitly logged out
      const hasLoggedOut = typeof window !== 'undefined' ? localStorage.getItem('user_logged_out') === 'true' : false;
      if (hasLoggedOut) {
        setIsLoading(false);
        return;
      }
      // In test mode, set up test user
      const testUser = {
        id: '2c9dcf1b-2e81-4b34-8ead-3292730f0ea6',
        email: 'test@example.com',
        full_name: 'Test User',
        is_active: true,
        is_superuser: false
      };
      const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTg4MjczMjMsInN1YiI6IjJjOWRjZjFiLTJlODEtNGIzNC04ZWFkLTMyOTI3MzBmMGVhNiJ9.Oh_3rUXNHD6mqtH75SD_V6GrYlWZaMS7VpQ_d2rsKdk';

      setUser(testUser);
      setToken(testToken);

      // Store token in localStorage for API calls
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', testToken);
        localStorage.removeItem('user_logged_out'); // Clear logout flag
      }

      setIsLoading(false);
      return;
    }
    const initializeAuth = async () => {
      try {
        // Only access localStorage on client side
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }
        
        const storedToken = localStorage.getItem('token');
        
        if (storedToken) {
          // Verify token and fetch user data
          // Use shared API client which attaches Authorization from localStorage
          const userData = await api.get<User>('/users/me');
          setUser(userData);
          setToken(storedToken);
        }
      } catch (error) {
        logger.error('Error initializing auth', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Fallback: If still loading after 2 seconds, force test mode setup
  useEffect(() => {
    if (testMode && isLoading) {
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined') {
          const hasLoggedOut = localStorage.getItem('user_logged_out') === 'true';
          if (!hasLoggedOut) {
            const testUser = {
              id: '2c9dcf1b-2e81-4b34-8ead-3292730f0ea6',
              email: 'test@example.com',
              full_name: 'Test User',
              is_active: true,
              is_superuser: false
            };
            const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTg4MjczMjMsInN1YiI6IjJjOWRjZjFiLTJlODEtNGIzNC04ZWFkLTMyOTI3MzBmMGVhNiJ9.Oh_3rUXNHD6mqtH75SD_V6GrYlWZaMS7VpQ_d2rsKdk';
            
            setUser(testUser);
            setToken(testToken);
            localStorage.setItem('token', testToken);
            localStorage.removeItem('user_logged_out');
            setIsLoading(false);
          }
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [testMode]);

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
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', tokenResponse.access_token);
          logger.debug('Token stored in localStorage');
        }
        
        const userData = await api.get<User>('/users/me');
        logger.debug('User data fetched:', userData);
        
        // Update state and storage
        setUser(userData);
        setToken(tokenResponse.access_token);
        
        // Clear logout flag if it exists
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user_logged_out');
        }
        
        // Show success toast
        toast.success('Signed in successfully', {
          duration: 3000,
          className: 'dark:bg-green-900 dark:text-green-100 dark:border-green-700 bg-green-50 text-green-800 border-green-200',
        });
        
        // Small delay to ensure toast is visible before redirect
        setTimeout(() => {
          router.replace('/dashboard');
        }, 100);
        
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
    // toast.success('Account created successfully');
    // Try auto-login
    try {
      const ok = await login(email, password);
      if (ok) {
        // login() will route to main page which checks onboarding
        return;
      }
    } catch (_) {
      // Fall through to manual login route
    }
    // If auto-login fails, move user to login page
    router.push('/login');
  };

  const logout = () => {
    // Clear state immediately and synchronously
    setUser(null);
    setToken(null);

    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.setItem('user_logged_out', 'true');
    }
    
    // Show logout success toast
    toast.success('Signed out successfully', {
      duration: 2000,
      className: 'dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700 bg-blue-50 text-blue-800 border-blue-200',
    });
    
    // Use window.location for immediate redirect to prevent any React state race conditions
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated,
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
