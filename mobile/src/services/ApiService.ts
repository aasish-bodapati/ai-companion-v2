import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import { API_BASE_URL } from '../config/api';

import { DebugUtils } from '../utils/debugUtils';

logger.api('API_BASE_URL:', API_BASE_URL);

// API Client configured

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Standardized timeout - backend has 30s timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for adding auth tokens if needed
api.interceptors.request.use(
  async config => {
    // Enhanced logging for debugging
    if (__DEV__) {
      DebugUtils.log('🌐 [API REQUEST]', {
        url: config.url,
        method: config.method,
        hasAuth: !!config.headers.Authorization,
        timestamp: new Date().toISOString()
      });
    }

    // Add auth token for non-public endpoints
    const isPublicAuthEndpoint = config.url === '/login/access-token' || config.url === '/register';
    const isIndianFoodEndpoint = config.url?.includes('/indian-foods/');

    if (!isPublicAuthEndpoint && !isIndianFoodEndpoint) {
      try {
        // AsyncStorage is now imported at the top
        const token = await AsyncStorage.getItem('token');

        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
          if (__DEV__) {
            DebugUtils.log('🔐 [API] Added auth token to request:', config.url);
          }
        } else if (!token) {
          DebugUtils.warn('🔐 [API] No auth token found for request to:', config.url);
        } else {
          if (__DEV__) {
            DebugUtils.log('🔐 [API] Request already has auth token:', config.url);
          }
        }
      } catch (error) {
        DebugUtils.error('🔐 [API] Error getting auth token:', error);
      }
    } else {
      if (__DEV__) {
        DebugUtils.log('🔐 [API] Public endpoint, no auth needed:', config.url);
      }
    }

    return config;
  },
  error => {
    DebugUtils.error('🔐 [API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  response => {
    // Enhanced logging for debugging
    if (__DEV__) {
      DebugUtils.log('🌐 [API RESPONSE]', {
        url: response.config.url,
        method: response.config.method,
        status: response.status,
        hasData: !!response.data,
        timestamp: new Date().toISOString()
      });
    }
    return response;
  },
  async error => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      DebugUtils.error('🔐 [API CLIENT] Authentication error:', {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url,
        headers: error.config?.headers
      });

      // Don't clear tokens for onboarding-related errors - these might be temporary
      const isOnboardingError = error.config?.url?.includes('/onboarding/');
      const isUserMeError = error.config?.url?.includes('/users/me');
      const isBodyTypeGoalsError = error.config?.url?.includes('/body-type-goals/');
      
      // Only clear tokens for specific endpoints that should trigger logout
      const shouldClearTokens = !isOnboardingError && !isUserMeError && !isBodyTypeGoalsError;
      
      if (shouldClearTokens) {
        // Clear tokens on 401 error (except for onboarding and user data endpoints)
        DebugUtils.log('🔐 [API CLIENT] Clearing tokens due to 401 error on:', error.config?.url);
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
        } catch (clearError) {
          DebugUtils.error('🔐 [API CLIENT] Error clearing tokens:', clearError);
        }
      } else {
        DebugUtils.log('🔐 [API CLIENT] Not clearing tokens for protected endpoint:', error.config?.url);
      }
    }
    // Only log important errors
    else if (error.response?.status >= 500 || error.config?.url?.includes('/login') || error.config?.url?.includes('/register')) {
      DebugUtils.error('❌ [API CLIENT] Error:', {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url
      });
    }

    // Handle different error types more gracefully - NO CONSOLE LOGGING
    // This prevents technical errors from showing in Expo Go notifications
    if (error.response?.status === 404) {
      // 404s are often expected (e.g., no workout scheduled, server starting up)
      // Silent - no logging
    } else if (error.response?.status === 401) {
      // 401s are authentication issues, not critical errors
      // Silent - no logging
    } else if (error.response?.status === 403) {
      // 403s are permission issues
      // Silent - no logging
    } else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      // Network errors are common and not critical
      // Silent - no logging
    } else if (error.code === 'ECONNABORTED') {
      // Timeout errors
      // Silent - no logging
    } else {
      // Silent error handling - no console logging to prevent Expo Go notifications
    }
    return Promise.reject(error);
  }
);

export default apiClient;
