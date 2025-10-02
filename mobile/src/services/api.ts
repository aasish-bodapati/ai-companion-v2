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
    console.log('🔍 [API CLIENT] Making request to:', config.url, 'Method:', config.method);
    
    // Log request body for POST requests
    if (config.method === 'post' && config.data) {
      console.log('🔍 [API CLIENT] Request body size:', JSON.stringify(config.data).length, 'characters');
      console.log('🔍 [API CLIENT] Request body preview:', JSON.stringify(config.data).substring(0, 200) + '...');
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
          console.log('🔍 [API CLIENT] Added token to request');
        } else if (!token) {
          console.warn('⚠️ [API CLIENT] No token found for authenticated endpoint:', config.url);
        }
      } catch (error) {
        console.error('❌ [API CLIENT] Error retrieving token:', error);
      }
    }
    
    return config;
  },
  error => {
    console.error('❌ [API CLIENT] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  response => {
    console.log('✅ [API CLIENT] Response received:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('❌ [API CLIENT] Response error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      data: error.response?.data,
      code: error.code,
      timeout: error.code === 'ECONNABORTED',
      networkError: error.message === 'Network Error'
    });
    return Promise.reject(error);
  }
);

export default apiClient;
