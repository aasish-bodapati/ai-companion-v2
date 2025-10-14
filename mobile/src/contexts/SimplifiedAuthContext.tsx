/**
 * Simplified AuthContext - Reduced complexity by using focused hooks
 * This replaces the complex 500+ line AuthContext
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken, clearAuthToken } from '../services/api';
import { DebugUtils } from '../utils/debugUtils';
import { useAuthActions } from '../hooks/useAuthActions';
import { useOnboarding } from '../hooks/useOnboarding';

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  timezone?: string;
}

interface AuthContextType {
  // User state
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Onboarding state
  needsOnboarding: boolean;
  
  // Auth actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  
  // Onboarding actions
  completeOnboarding: (data?: any) => Promise<void>;
  rerunOnboarding: () => void;
  
  // User management
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Core state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use focused hooks
  const authActions = useAuthActions();
  const onboarding = useOnboarding();

  // Safety wrapper for setUser
  const setUserSafe = (userData: User | null) => {
    if (userData && typeof userData === 'object' && userData.id !== undefined) {
      setUser(userData);
    } else {
      DebugUtils.warn('🔐 [AUTH CONTEXT] Invalid user data provided:', userData);
      setUser(null);
    }
  };

  // Check for existing session on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        setAuthToken(storedToken);
        
        // Set user from stored data first
        try {
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } catch {
          // Ignore stored user errors
        }
        
        // Verify token with backend
        try {
          const response = await api.get('/api/v1/users/me');
          setUserSafe(response.data);
          await AsyncStorage.setItem('user', JSON.stringify(response.data));
        } catch (error: unknown) {
          // Token is invalid, clear it
          if (__DEV__) {
            DebugUtils.log('🔐 [AUTH CONTEXT] Token validation failed, clearing invalid token');
          }
          await AsyncStorage.removeItem('token');
          setToken(null);
          setUser(null);
          clearAuthToken();
        }

        // Check onboarding status
        if (storedToken) {
          await onboarding.checkOnboardingStatus();
        }
      } else {
        onboarding.setNeedsOnboarding(true);
      }
    } catch {
      // Silent error handling
      await AsyncStorage.removeItem('token');
      setToken(null);
      setUser(null);
      clearAuthToken();
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced login that updates local state
  const login = async (email: string, password: string) => {
    const result = await authActions.login(email, password);
    
    if (result.success) {
      // Update local state after successful login
      await checkAuthStatus();
    }
    
    return result;
  };

  // Enhanced logout that clears local state
  const logout = async () => {
    await authActions.logout();
    setToken(null);
    setUser(null);
    onboarding.setNeedsOnboarding(false);
  };

  // Enhanced delete account that clears local state
  const deleteAccount = async () => {
    const result = await authActions.deleteAccount();
    
    if (result.success) {
      setToken(null);
      setUser(null);
      onboarding.setNeedsOnboarding(true);
    }
    
    return result;
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const isAuthenticatedValue = !!user && !!token;

  const value: AuthContextType = useMemo(() => ({
    // User state
    user,
    token,
    isAuthenticated: isAuthenticatedValue,
    isLoading,
    
    // Onboarding state
    needsOnboarding: onboarding.needsOnboarding,
    
    // Auth actions
    login,
    register: authActions.register,
    logout,
    deleteAccount,
    
    // Onboarding actions
    completeOnboarding: onboarding.completeOnboarding,
    rerunOnboarding: onboarding.rerunOnboarding,
    
    // User management
    updateUser,
  }), [
    user, 
    token, 
    isAuthenticatedValue, 
    isLoading, 
    onboarding.needsOnboarding,
    onboarding.completeOnboarding,
    onboarding.rerunOnboarding,
    authActions.register
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
