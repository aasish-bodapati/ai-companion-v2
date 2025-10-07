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

  const checkAuthStatus = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        // Verify token with backend
        try {
          const response = await apiClient.get('/users/me');
          if (__DEV__) {
            console.log('🔍 User data from API:', response.data);
          }
          setUser(response.data);
        } catch (userError: any) {
          // Silent error handling - no console logging to prevent Expo Go notifications
          // Clear invalid token
          await AsyncStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
        
        // Check onboarding completion status from backend
        try {
          const onboardingStatus = await apiClient.get('/health/onboarding/status');
          if (__DEV__) {
            console.log('🔍 checkAuthStatus - onboarding status from API:', onboardingStatus.data);
          }
          const completed = onboardingStatus.data.completed;
          
          // Check if onboarding is completed
          setNeedsOnboarding(!completed);
          if (__DEV__) {
            console.log('🔍 checkAuthStatus - completed:', completed, 'setNeedsOnboarding to:', !completed);
          }
        } catch (onboardingError) {
          console.log('🔍 checkAuthStatus - onboarding status error:', onboardingError);
          // Default to needing onboarding if we can't check
          setNeedsOnboarding(true);
        }
      } else {
        // No token - user needs to log in, but if they do, they'll need onboarding
        setNeedsOnboarding(true);
      }
    } catch (_error) {
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
      
      console.log('🔍 [AUTH] Login form data:', formData);
      
      const response = await apiClient.post('/login/access-token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, token_type } = response.data;
      
      // Store token
      await AsyncStorage.setItem('token', access_token);
      setToken(access_token);
      
      // Get user data separately
      try {
        const userResponse = await apiClient.get('/users/me');
        setUser(userResponse.data);
      } catch (_error) {
        // Silent error handling - no console logging to prevent Expo Go notifications
        // Set basic user data from login response if available
        setUser({
          id: 13, // This should come from the token or a separate call
          email: email,
          full_name: 'User',
          is_active: true,
        });
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
      } catch (_error) {
        console.log('🔍 login - onboarding status error:', error);
        // Default to needing onboarding if we can't check
        setNeedsOnboarding(true);
      }

      return { success: true };
    } catch (error: any) {
      // Handle different types of errors and show appropriate toast notifications
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.status === 404) {
        // Silent error handling - no console logging to prevent Expo Go notifications
        errorMessage = 'Server is not available. Please try again in a moment.';
      } else if (error.response?.status === 401) {
        // Silent error handling - no console logging to prevent Expo Go notifications
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        // Silent error handling - no console logging to prevent Expo Go notifications
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.response?.status === 400) {
        const errorDetail = error.response?.data?.detail || error.response?.data?.message;
        if (errorDetail?.includes('Incorrect email or password')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (errorDetail?.includes('Inactive user')) {
          errorMessage = 'Your account has been deactivated. Please contact support.';
        } else {
          errorMessage = errorDetail || 'Invalid credentials. Please try again.';
        }
      } else if (error.response?.status === 422) {
        errorMessage = 'Please check your email and password format.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else {
        // Silent error handling - no console logging to prevent Expo Go notifications
        errorMessage = 'Login failed. Please try again.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const register = async (email: string, password: string, fullName: string): Promise<{ success: boolean; error?: string }> => {
    console.log('🔍 [AUTH CONTEXT] register called with:', { email, fullName, passwordLength: password.length });
    
    try {
      console.log('🔍 [AUTH CONTEXT] Making API call to /register');
      const response = await apiClient.post('/register', {
        email,
        password,
        full_name: fullName,
      });
      console.log('🔍 [AUTH CONTEXT] Registration API response:', response.data);
      return { success: true };
    } catch (error: any) {
      console.log('🔍 [AUTH CONTEXT] Registration API error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        code: error.code
      });
      
      // Handle specific error cases and show toast notifications
      let errorMessage = 'Registration failed. Please try again later.';
      
      if (error.response?.status === 400) {
        const errorDetail = error.response?.data?.detail || error.response?.data?.message;
        if (errorDetail?.includes('already exists')) {
          errorMessage = 'An account with this email already exists. Please try logging in instead.';
        } else {
          errorMessage = errorDetail || 'Registration failed. Please try again.';
        }
      } else if (error.response?.status === 422) {
        errorMessage = 'Please check your information and try again.';
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else {
        errorMessage = 'Registration failed. Please try again later.';
      }
      
      console.log('🔍 [AUTH CONTEXT] Error message to show:', errorMessage);
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint if token exists
      if (token) {
        await apiClient.post('/logout');
      }
    } catch (_error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
    } finally {
      // Clear local storage
      await AsyncStorage.removeItem('token');
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
    } catch (_error) {
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
      console.log('🔍 [AUTH CONTEXT] deleteAccount called');
      
      const response = await apiClient.delete('/me');
      console.log('🔍 [AUTH CONTEXT] Delete account response:', response.data);
      
      // Clear local state
      await AsyncStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setNeedsOnboarding(true);
      
      return { success: true };
    } catch (error: any) {
      console.log('🔍 [AUTH CONTEXT] Delete account error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        code: error.code
      });
      
      let errorMessage = 'Failed to delete account. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'You are not authorized to delete this account.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
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

