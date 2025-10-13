import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken, clearAuthToken } from '../services/api';
import { DebugUtils } from '../utils/debugUtils';

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
  }, []); // Remove token from dependencies to prevent infinite re-renders

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
        
        // Verify token with backend (only if we have a token)
        try {
          const response = await api.get('/api/v1/users/me');
          setUser(response);
          // Update stored user data with fresh data from server
          await AsyncStorage.setItem('user', JSON.stringify(response));
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

        // Check onboarding completion status from backend (only if we have a valid token)
        if (storedToken) {
          try {
            const onboardingStatus = await api.get('/api/v1/health/onboarding/status');
            const completed = onboardingStatus.completed;

            // Check if onboarding is completed
            setNeedsOnboarding(!completed);
            if (__DEV__) {
              DebugUtils.log('🔍 Auth check - onboarding:', completed ? 'completed' : 'needed');
            }
          } catch (error) {
            if (__DEV__) {
              DebugUtils.log('🔍 Auth check - onboarding error, defaulting to needed');
            }
            // Default to needing onboarding if we can't check
            setNeedsOnboarding(true);
          }
        } else {
          // No token, assume onboarding is needed
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
      clearAuthToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
        if (__DEV__) {
          DebugUtils.log('🔐 [LOGIN] Starting login for:', email);
        }

      // Test basic variables first
      if (__DEV__) {
        DebugUtils.log('🔐 [LOGIN] Validating credentials...');
      }

      // Login endpoint expects form-encoded data, not JSON
      let formData: string;
      try {
        formData = `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
        // Form data prepared
      } catch (error) {
        if (__DEV__) {
          DebugUtils.log('🔐 [LOGIN] Error preparing form data:', error);
        }
        throw error;
      }

      let responseData: any;
      try {
        // Making API call
        responseData = await api.post('/api/v1/login/access-token', formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
        if (__DEV__) {
          DebugUtils.log('🔐 [LOGIN] API call successful');
        }
      } catch (error) {
        if (__DEV__) {
          DebugUtils.log('🔐 [LOGIN] API call failed:', error);
        }
        throw error;
      }

      const { access_token } = responseData;

      // Store token
      await AsyncStorage.setItem('token', access_token);
      setToken(access_token);
      setAuthToken(access_token);

      // Get user data separately
      let userData: User | null = null;
      try {
        // Getting user data
        const userResponse = await api.get('/api/v1/users/me');
        userData = userResponse; // Use response directly, not .data
        setUser(userData);
        // Store user data in AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        if (__DEV__) {
          DebugUtils.log('🔐 [LOGIN] Failed to get user data from API:', error);
        }
        // Silent error handling - no console logging to prevent Expo Go notifications
        // Set basic user data from login response if available
        userData = {
          id: 0, // Temporary ID - will be updated when API call succeeds
          email: email,
          full_name: 'User',
          is_active: true,
        };
        setUser(userData);
        // Store basic user data in AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      }

      // Check onboarding status
      try {
        const onboardingStatus = await api.get('/api/v1/health/onboarding/status');
        if (__DEV__) {
          DebugUtils.log('🔍 login - onboarding status from API:', onboardingStatus);
        }
        const completed = onboardingStatus.completed;
        setNeedsOnboarding(!completed);
        if (__DEV__) {
          DebugUtils.log('🔍 login - completed:', completed, 'setNeedsOnboarding to:', !completed);
        }
      } catch (error) {
        if (__DEV__) {
          DebugUtils.log('🔍 login - onboarding status error:', error);
        }
        // Default to needing onboarding if we can't check
        setNeedsOnboarding(true);
      }

        if (__DEV__) {
          DebugUtils.log('🔐 [LOGIN] Login completed successfully');
        }

      // Force a small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));

      return { success: true };
    } catch (error: unknown) {
      if (__DEV__) {
        DebugUtils.log('🔐 [LOGIN] ===== LOGIN ERROR =====');
        DebugUtils.log('🔐 [LOGIN] Error details:', error);
      }
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
      await api.post('/api/v1/register', {
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
        await api.post('/api/v1/logout');
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
      clearAuthToken();
    }
  };

  const completeOnboarding = async (data?: OnboardingData) => {
    DebugUtils.log('🎉 AuthContext completeOnboarding called with data:', data);
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
      const response = await api.post('/api/v1/health/onboarding/complete', onboardingData);

      DebugUtils.log('🎉 Backend onboarding completion response:', response.data);
      setNeedsOnboarding(false);
      DebugUtils.log('🎉 AuthContext completeOnboarding completed - needsOnboarding set to false');
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      // Still mark as completed locally to prevent infinite onboarding loop
      setNeedsOnboarding(false);
    }
  };

  const rerunOnboarding = async () => {
    DebugUtils.log('🔄 AuthContext rerunOnboarding called');
    setNeedsOnboarding(true);
    // Note: We don't need to call backend here since we're just allowing the user
    // to go through onboarding again. The backend will handle the completion when
    // they finish onboarding.
    DebugUtils.log('🔄 AuthContext rerunOnboarding completed - needsOnboarding set to true');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await api.delete('/api/v1/me');

      // Clear local state
      await AsyncStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setNeedsOnboarding(true);
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

  const isAuthenticatedValue = !!user && !!token;

  const value: AuthContextType = useMemo(() => ({
    user,
    token,
    isAuthenticated: isAuthenticatedValue,
    isLoading,
    needsOnboarding,
    login,
    register,
    logout,
    completeOnboarding,
    rerunOnboarding,
    updateUser,
    deleteAccount,
  }), [user, token, isAuthenticatedValue, isLoading, needsOnboarding, login, register, logout, completeOnboarding, rerunOnboarding, updateUser, deleteAccount]);

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

