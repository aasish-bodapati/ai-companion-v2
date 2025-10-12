import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/api';
// Note: Toast notifications are handled by the calling component

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  timezone?: string;
}

interface OnboardingData {
  age: number;
  gender: string;
  height_cm: number;
  current_weight_kg: number;
  activity_level: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; }>;
  register: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string; }>;
  logout: () => void;
  completeOnboarding: (data?: OnboardingData) => void;
  rerunOnboarding: () => void;
  updateUser: (userData: Partial<User>) => void;
  deleteAccount: () => Promise<{ success: boolean; error?: string; }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Check for existing session on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Listen for token changes (when API client clears tokens on 401)
  useEffect(() => {
    const checkTokenStatus = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken && token) {
        // Token was cleared by API client, logout user
        setToken(null);
        setUser(null);
        setNeedsOnboarding(false);
      }
    };

    // Check token status every 5 seconds
    const interval = setInterval(checkTokenStatus, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const checkAuthStatus = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        // Verify token with backend
        try {
          const response = await apiClient.get('/users/me');
          setUser(response.data);
        } catch (error: unknown) {
          // Don't clear tokens on error during app startup/reload
          // This prevents the logout issue when reloading Expo Go
          if (__DEV__) {
            console.log('🔐 [AUTH CONTEXT] Token validation failed, but keeping session for now');
          }
          // Set user from stored data instead
          try {
            const storedUser = await AsyncStorage.getItem('user');
            if (storedUser) {
              setUser(JSON.parse(storedUser));
            }
          } catch {
            // Ignore stored user errors
          }
        }
        
        // Check onboarding completion status from backend
        try {
          const onboardingStatus = await apiClient.get('/health/onboarding/status');
          const completed = onboardingStatus.data.completed;
          
          // Check if onboarding is completed
          setNeedsOnboarding(!completed);
          if (__DEV__) {
            console.log('🔍 Auth check - onboarding:', completed ? 'completed' : 'needed');
          }
        } catch (error) {
          if (__DEV__) {
            console.log('🔍 Auth check - onboarding error, defaulting to needed');
          }
          // Default to needing onboarding if we can't check
          setNeedsOnboarding(true);
        }
      } else {
        // No token - user needs to log in, but if they do, they'll need onboarding
        setNeedsOnboarding(true);
      }
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      // Clear invalid token
      await AsyncStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Login endpoint expects form-encoded data, not JSON
      const formData = `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      
      
      const response = await apiClient.post('/login/access-token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = response.data;
      
      // Store token
      await AsyncStorage.setItem('token', access_token);
      setToken(access_token);
      
      // Get user data separately
      try {
        const userResponse = await apiClient.get('/users/me');
        setUser(userResponse.data);
        // Store user data in AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(userResponse.data));
      } catch {
        // Silent error handling - no console logging to prevent Expo Go notifications
        // Set basic user data from login response if available
        const basicUser = {
          id: 13, // This should come from the token or a separate call
          email: email,
          full_name: 'User',
          is_active: true,
        };
        setUser(basicUser);
        // Store basic user data in AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(basicUser));
      }

      // Check onboarding status
      try {
        const onboardingStatus = await apiClient.get('/health/onboarding/status');
        if (__DEV__) {
          console.log('🔍 login - onboarding status from API:', onboardingStatus.data);
        }
        const completed = onboardingStatus.data.completed;
        setNeedsOnboarding(!completed);
        if (__DEV__) {
          console.log('🔍 login - completed:', completed, 'setNeedsOnboarding to:', !completed);
        }
      } catch {
        console.log('🔍 login - onboarding status error');
        // Default to needing onboarding if we can't check
        setNeedsOnboarding(true);
      }

      return { success: true };
    } catch (error: unknown) {
      // Handle different types of errors and show appropriate toast notifications
      let errorMessage = 'Login failed. Please try again.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error.response as { status?: number; data?: { detail?: string; message?: string } };
        if (errorResponse.status === 404) {
          // Silent error handling - no console logging to prevent Expo Go notifications
          errorMessage = 'Server is not available. Please try again in a moment.';
        } else if (errorResponse.status === 401) {
          // Silent error handling - no console logging to prevent Expo Go notifications
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
        } else {
          // Silent error handling - no console logging to prevent Expo Go notifications
          errorMessage = 'Login failed. Please try again.';
        }
      } else if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = error.code as string;
        const errorMsg = error.message as string;
        if (errorCode === 'NETWORK_ERROR' || errorMsg === 'Network Error') {
          // Silent error handling - no console logging to prevent Expo Go notifications
          errorMessage = 'Network error. Please check your connection.';
        } else if (errorCode === 'ECONNABORTED' || errorMsg?.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else {
          // Silent error handling - no console logging to prevent Expo Go notifications
          errorMessage = 'Login failed. Please try again.';
        }
      } else {
        // Silent error handling - no console logging to prevent Expo Go notifications
        errorMessage = 'Login failed. Please try again.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const register = async (email: string, password: string, fullName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.post('/register', {
        email,
        password,
        full_name: fullName,
      });
      return { success: true };
    } catch (error: unknown) {
      
      // Handle specific error cases and show toast notifications
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
        } else {
          errorMessage = 'Registration failed. Please try again later.';
        }
      } else if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = error.code as string;
        const errorMsg = error.message as string;
        if (errorCode === 'NETWORK_ERROR' || errorMsg?.includes('Network Error')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (errorCode === 'ECONNABORTED' || errorMsg?.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else {
          errorMessage = 'Registration failed. Please try again later.';
        }
      } else {
        errorMessage = 'Registration failed. Please try again later.';
      }
      
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint if token exists
      if (token) {
        await apiClient.post('/logout');
      }
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
    } finally {
      // Clear local storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setNeedsOnboarding(false);
    }
  };

  const completeOnboarding = async (data?: OnboardingData) => {
    console.log('🎉 AuthContext completeOnboarding called with data:', data);
    try {
      // Use provided data or default values
      const onboardingData = data || {
        age: 25,
        gender: 'male',
        height_cm: 175,
        current_weight_kg: 70,
        activity_level: 'moderate'
      };

      // Call backend API to complete onboarding
      const response = await apiClient.post('/health/onboarding/complete', onboardingData);
      
      console.log('🎉 Backend onboarding completion response:', response.data);
      setNeedsOnboarding(false);
      console.log('🎉 AuthContext completeOnboarding completed - needsOnboarding set to false');
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      // Still mark as completed locally to prevent infinite onboarding loop
      setNeedsOnboarding(false);
    }
  };

  const rerunOnboarding = async () => {
    console.log('🔄 AuthContext rerunOnboarding called');
    setNeedsOnboarding(true);
    // Note: We don't need to call backend here since we're just allowing the user
    // to go through onboarding again. The backend will handle the completion when
    // they finish onboarding.
    console.log('🔄 AuthContext rerunOnboarding completed - needsOnboarding set to true');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.delete('/me');
      
      // Clear local state
      await AsyncStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setNeedsOnboarding(true);
      
      return { success: true };
    } catch (error: unknown) {
      
      let errorMessage = 'Failed to delete account. Please try again.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error.response as { status?: number };
        if (errorResponse.status === 401) {
          errorMessage = 'You are not authorized to delete this account.';
        } else if (errorResponse.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = 'Failed to delete account. Please try again.';
        }
      } else if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = error.code as string;
        const errorMsg = error.message as string;
        if (errorCode === 'NETWORK_ERROR' || errorMsg?.includes('Network Error')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (errorCode === 'ECONNABORTED' || errorMsg?.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else {
          errorMessage = 'Failed to delete account. Please try again.';
        }
      } else {
        errorMessage = 'Failed to delete account. Please try again.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    needsOnboarding,
    login,
    register,
    logout,
    completeOnboarding,
    rerunOnboarding,
    updateUser,
    deleteAccount,
  };

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

