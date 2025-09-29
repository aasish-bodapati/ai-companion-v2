import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/api';
import { showToast } from '../utils/toast';

interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
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
        const response = await apiClient.get('/users/me');
        console.log('🔍 User data from API:', response.data);
        setUser(response.data);
        
        // Check onboarding completion status from backend
        try {
          const onboardingStatus = await apiClient.get('/health/onboarding/status');
          console.log('🔍 checkAuthStatus - onboarding status from API:', onboardingStatus.data);
          setNeedsOnboarding(!onboardingStatus.data.completed);
          console.log('🔍 checkAuthStatus - setNeedsOnboarding to:', !onboardingStatus.data.completed);
        } catch (onboardingError) {
          console.log('🔍 checkAuthStatus - failed to get onboarding status:', onboardingError);
          // Default to needing onboarding if we can't check
          setNeedsOnboarding(true);
        }
      }
    } catch (error) {
      console.log('Auth check failed:', error);
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
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
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
      } catch (error) {
        console.log('Failed to get user data:', error);
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
        console.log('🔍 login - onboarding status from API:', onboardingStatus.data);
        setNeedsOnboarding(!onboardingStatus.data.completed);
        console.log('🔍 login - setNeedsOnboarding to:', !onboardingStatus.data.completed);
      } catch (error) {
        console.log('🔍 login - failed to get onboarding status:', error);
        setNeedsOnboarding(true);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorDetail = error.response?.data?.detail || error.response?.data?.message;
        if (errorDetail?.includes('Incorrect email or password')) {
          return { success: false, error: 'Invalid email or password. Please check your credentials and try again.' };
        } else if (errorDetail?.includes('Inactive user')) {
          return { success: false, error: 'Your account has been deactivated. Please contact support.' };
        } else {
          return { success: false, error: errorDetail || 'Invalid credentials. Please try again.' };
        }
      } else if (error.response?.status === 422) {
        return { success: false, error: 'Please check your email and password format.' };
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        return { success: false, error: 'Network error. Please check your internet connection and try again.' };
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return { success: false, error: 'Request timed out. Please try again.' };
      } else {
        return { success: false, error: 'Login failed. Please try again later.' };
      }
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
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorDetail = error.response?.data?.detail || error.response?.data?.message;
        if (errorDetail?.includes('already exists')) {
          return { success: false, error: 'An account with this email already exists. Please try logging in instead.' };
        } else {
          return { success: false, error: errorDetail || 'Registration failed. Please try again.' };
        }
      } else if (error.response?.status === 422) {
        return { success: false, error: 'Please check your information and try again.' };
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        return { success: false, error: 'Network error. Please check your internet connection and try again.' };
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return { success: false, error: 'Request timed out. Please try again.' };
      } else {
        return { success: false, error: 'Registration failed. Please try again later.' };
      }
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint if token exists
      if (token) {
        await apiClient.post('/logout');
      }
    } catch (error) {
      console.log('Logout API call failed:', error);
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
    } catch (error) {
      console.error('❌ Failed to complete onboarding on backend:', error);
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

