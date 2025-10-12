import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

import { DebugUtils } from '../utils/debugUtils';

const API_URL = 'http://192.168.1.11:8000';
const API_BASE_URL = `${API_URL}/api/v1`;

logger.api('API_URL:', API_URL);
logger.api('API_BASE_URL:', API_BASE_URL);

// API Client configured

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000, // 25 second timeout - backend has 30s timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for adding auth tokens if needed
api.interceptors.request.use(
  async config => {
    // Only log important requests in development mode
    if (__DEV__ && config.url?.includes('/login') || config.url?.includes('/register')) {
      logger.api('Making request to:', config.url, 'Method:', config.method);
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
        } else if (!token) {
          DebugUtils.warn('🔐 [API] No auth token found for request to:', config.url);
        }
      } catch (error) {
        DebugUtils.error('🔐 [API] Error getting auth token:', error);
      }
    }

    return config;
  },
  error => {
    // Silent error handling - no console logging to prevent Expo Go notifications
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  response => {
    // Only log important responses in development
    if (__DEV__ && (response.config.url?.includes('/login') || response.config.url?.includes('/register'))) {
      logger.api('Response received:', response.status, response.config.url);
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

      // Clear tokens on 401 error
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      } catch (clearError) {
        DebugUtils.error('🔐 [API CLIENT] Error clearing tokens:', clearError);
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
