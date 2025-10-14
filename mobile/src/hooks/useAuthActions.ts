/**
 * Auth Actions Hook - Handles login, register, logout actions
 * Extracted from AuthContext to reduce complexity
 */

import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken, clearAuthToken } from '../services/api';
import { DebugUtils } from '../utils/debugUtils';

interface AuthActions {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

export function useAuthActions(): AuthActions {
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (isLoading) return { success: false, error: 'Login already in progress' };
    
    setIsLoading(true);
    try {
      if (__DEV__) {
        DebugUtils.log('🔐 [LOGIN] Starting login for:', email);
      }

      // Prepare form data
      const formData = `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;

      // Make API call
      const responseData = await api.post('/api/v1/login/access-token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = responseData;
      
      // Store token
      await AsyncStorage.setItem('token', access_token);
      setAuthToken(access_token);

      // Get user data
      const userResponse = await api.get('/api/v1/users/me');
      const userData = userResponse.data;
      
      // Store user data
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      if (__DEV__) {
        DebugUtils.log('🔐 [LOGIN] Login completed successfully');
      }

      return { success: true };
    } catch (error: unknown) {
      if (__DEV__) {
        DebugUtils.log('🔐 [LOGIN] Login error:', error);
      }

      // Handle different error types
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
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string): Promise<{ success: boolean; error?: string }> => {
    if (isLoading) return { success: false, error: 'Registration already in progress' };
    
    setIsLoading(true);
    try {
      await api.post('/api/v1/register', {
        email,
        password,
        full_name: fullName,
      });
      return { success: true };
    } catch (error: unknown) {
      // Handle specific error cases
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
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call logout endpoint if token exists
      const token = await AsyncStorage.getItem('token');
      if (token) {
        await api.post('/api/v1/logout');
      }
    } catch {
      // Silent error handling
    } finally {
      // Clear local storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      clearAuthToken();
    }
  };

  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    if (isLoading) return { success: false, error: 'Account deletion already in progress' };
    
    setIsLoading(true);
    try {
      await api.delete('/api/v1/me');

      // Clear local state
      await AsyncStorage.removeItem('token');
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
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    register,
    logout,
    deleteAccount,
  };
}
