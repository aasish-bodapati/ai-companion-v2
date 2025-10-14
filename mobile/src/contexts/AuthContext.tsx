/**
 * Focused AuthContext - Authentication only
 * 
 * Responsibilities:
 * - User authentication (login, register, logout)
 * - Token management
 * - Authentication state
 * 
 * Removed:
 * - Onboarding logic (moved to UserContext)
 * - User profile management (moved to UserContext)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken, clearAuthToken } from '../services/api';
import { DebugUtils } from '../utils/debugUtils';

// ===== TYPES =====

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  timezone?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; }>;
  register: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string; }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  deleteAccount: () => Promise<{ success: boolean; error?: string; }>;
}

// ===== CONTEXT =====

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// ===== PROVIDER =====

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isCheckingAuth = useRef(false);

  // Safety wrapper for setUser to ensure user object is always valid
  const setUserSafe = (userData: User | null) => {
    if (userData && typeof userData === 'object' && userData.id !== undefined) {
      if (__DEV__) {
        DebugUtils.log('🔐 [AUTH CONTEXT] Setting user:', userData.email);
      }
      setUser(userData);
    } else if (userData === null) {
      setUser(null);
    } else {
      DebugUtils.warn('🔐 [AUTH CONTEXT] Invalid user data provided:', userData);
      setUser(null);
    }
  };

  // Check for existing session on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // ===== AUTHENTICATION FUNCTIONS =====

  const checkAuthStatus = useCallback(async () => {
    if (isCheckingAuth.current) return;
    isCheckingAuth.current = true;
    
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        DebugUtils.log('🔐 [AUTH CONTEXT] Retrieved token from storage');
        setToken(storedToken);
        setAuthToken(storedToken);
        
        // Verify token with backend
        try {
          const userData = await api.get('/api/v1/users/me');
          DebugUtils.log('🔐 [AUTH CONTEXT] User data received:', userData);
          
          if (userData && typeof userData === 'object' && userData.id !== undefined) {
            setUserSafe(userData);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
          } else {
            DebugUtils.warn('🔐 [AUTH CONTEXT] Invalid user data received from API:', userData);
            throw new Error('Invalid user data received');
          }
        } catch (error) {
          // Token is invalid, clear it
          DebugUtils.log('🔐 [AUTH CONTEXT] Token validation failed, clearing invalid token');
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          setToken(null);
          setUser(null);
          clearAuthToken();
        }
      }
    } catch (error) {
      // Clear invalid token
      await AsyncStorage.removeItem('token');
      setToken(null);
      setUser(null);
      clearAuthToken();
    } finally {
      isCheckingAuth.current = false;
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      DebugUtils.log('🔐 [LOGIN] Starting login for:', email);

      // Prepare form data
      const formData = `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;

      // Make login API call
      const responseData = await api.post('/api/v1/login/access-token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = responseData;
      DebugUtils.log('🔐 [LOGIN] Got access token');

      // Store token
      await AsyncStorage.setItem('token', access_token);
      setToken(access_token);
      setAuthToken(access_token);

      // Get user data
      const userData = await api.get('/api/v1/users/me');
      DebugUtils.log('🔐 [LOGIN] User data received:', userData);
      
      if (userData && typeof userData === 'object' && userData.id !== undefined) {
        setUserSafe(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error('Invalid user data received');
      }

      DebugUtils.log('🔐 [LOGIN] Login completed successfully');
      return { success: true };
    } catch (error: unknown) {
      DebugUtils.log('🔐 [LOGIN] Login error:', error);
      
      // Handle different types of errors
      let errorMessage = 'Login failed. Please try again.';

      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error.response as { status?: number; data?: { detail?: string; message?: string } };
        if (errorResponse.status === 401) {
          errorMessage = 'Invalid email or password';
        } else if (errorResponse.status === 400) {
          const errorDetail = errorResponse.data?.detail || errorResponse.data?.message;
          if (errorDetail?.includes('Incorrect email or password')) {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          } else if (errorDetail?.includes('Inactive user')) {
            errorMessage = 'Your account has been deactivated. Please contact support.';
          } else {
            errorMessage = errorDetail || 'Invalid credentials. Please try again.';
          }
        } else if (errorResponse.status === 422) {
          errorMessage = 'Please check your email and password format.';
        } else if (errorResponse.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = error.code as string;
        const errorMsg = error.message as string;
        if (errorCode === 'NETWORK_ERROR' || errorMsg === 'Network Error') {
          errorMessage = 'Network error. Please check your connection.';
        } else if (errorCode === 'ECONNABORTED' || errorMsg?.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        }
      }

      return { success: false, error: errorMessage };
    }
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await api.post('/api/v1/register', {
        email,
        password,
        full_name: fullName,
      });
      return { success: true };
    } catch (error: unknown) {
      let errorMessage = 'Registration failed. Please try again later.';

      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error.response as { status?: number; data?: { detail?: string; message?: string } };
        if (errorResponse.status === 400) {
          const errorDetail = errorResponse.data?.detail || errorResponse.data?.message;
          if (errorDetail?.includes('already exists')) {
            errorMessage = 'An account with this email already exists. Please try logging in instead.';
          } else {
            errorMessage = errorDetail || 'Registration failed. Please try again.';
          }
        } else if (errorResponse.status === 422) {
          errorMessage = 'Please check your information and try again.';
        }
      } else if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = error.code as string;
        const errorMsg = error.message as string;
        if (errorCode === 'NETWORK_ERROR' || errorMsg?.includes('Network Error')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (errorCode === 'ECONNABORTED' || errorMsg?.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        }
      }

      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await api.post('/api/v1/logout');
      }
    } catch (error) {
      DebugUtils.log('🔐 [LOGOUT] Logout API error:', error);
    } finally {
      // Clear local storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
      clearAuthToken();
    }
  }, [token]);

  const updateUser = useCallback((userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  }, [user]);

  const deleteAccount = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await api.delete('/api/v1/me');

      // Clear local state
      await AsyncStorage.removeItem('token');
      setToken(null);
      setUser(null);
      clearAuthToken();

      return { success: true };
    } catch (error: unknown) {
      let errorMessage = 'Failed to delete account. Please try again.';

      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error.response as { status?: number };
        if (errorResponse.status === 401) {
          errorMessage = 'You are not authorized to delete this account.';
        } else if (errorResponse.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = error.code as string;
        const errorMsg = error.message as string;
        if (errorCode === 'NETWORK_ERROR' || errorMsg?.includes('Network Error')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (errorCode === 'ECONNABORTED' || errorMsg?.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        }
      }

      return { success: false, error: errorMessage };
    }
  }, []);

  // ===== CONTEXT VALUE =====

  const isAuthenticatedValue = !!user && !!token;

  const value: AuthContextType = useMemo(() => ({
    user,
    token,
    isAuthenticated: isAuthenticatedValue,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    deleteAccount,
  }), [user, token, isAuthenticatedValue, isLoading, login, register, logout, updateUser, deleteAccount]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ===== HOOK =====

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}