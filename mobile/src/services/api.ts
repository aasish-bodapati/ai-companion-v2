import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000';
const API_BASE_URL = `${API_URL}/api/v1`;

console.log('🔍 [API CONFIG] API_URL:', API_URL);
console.log('🔍 [API CONFIG] API_BASE_URL:', API_BASE_URL);

// API Client configured

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 second timeout - backend processing is slow
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for adding auth tokens if needed
apiClient.interceptors.request.use(
  async config => {
    // Only log requests in development mode
    if (__DEV__) {
      console.log('🔍 [API CLIENT] Making request to:', config.url, 'Method:', config.method);
      
      // Log request body for POST requests
      if (config.method === 'post' && config.data) {
        console.log('🔍 [API CLIENT] Request body size:', JSON.stringify(config.data).length, 'characters');
        console.log('🔍 [API CLIENT] Request body preview:', JSON.stringify(config.data).substring(0, 200) + '...');
      }
    }
    
    // Add auth token for non-public endpoints
    const isPublicAuthEndpoint = config.url === '/login/access-token' || config.url === '/register';
    const isIndianFoodEndpoint = config.url?.includes('/indian-foods/');
    
    if (!isPublicAuthEndpoint && !isIndianFoodEndpoint) {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const token = await AsyncStorage.getItem('token');
        
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
          if (__DEV__) {
            console.log('🔍 [API CLIENT] Added token to request');
          }
        } else if (!token && __DEV__) {
          // Silent warning handling - no console logging to prevent Expo Go notifications
        }
      } catch (error) {
        // Silent error handling - no console logging to prevent Expo Go notifications
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
apiClient.interceptors.response.use(
  response => {
    // Only log successful responses in development
    if (__DEV__) {
      console.log('✅ [API CLIENT] Response received:', response.status, response.config.url);
    }
    return response;
  },
  error => {
    // Log all errors for debugging registration issues
    console.log('🔍 [API CLIENT] Response error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      code: error.code,
      url: error.config?.url
    });
    
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
