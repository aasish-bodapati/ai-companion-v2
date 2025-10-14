/**
 * API Service Client
 * Centralized API client for all backend communication
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';


import { DebugUtils } from '../utils/debugUtils';

import { API_BASE_URL } from '../config/api';

// API Configuration
const API_CONFIG = {
  baseURL: API_BASE_URL.replace('/api/v1', ''), // Remove /api/v1 since we add it in requests
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Request interceptor
const requestInterceptor = (config: AxiosRequestConfig) => {
  const startTime = Date.now();
  config.metadata = { startTime };
  
  // Add auth token if available
  const token = getAuthToken();
  if (token) {
    DebugUtils.log('🔐 [API INTERCEPTOR] Adding token to request:', {
      tokenLength: token.length,
      tokenStart: token.substring(0, 20) + '...',
      tokenEnd: '...' + token.substring(token.length - 20),
      hasDots: token.includes('.'),
      dotCount: (token.match(/\./g) || []).length
    });
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  } else {
    DebugUtils.log('🔐 [API INTERCEPTOR] No token available for request');
  }
  
  DebugUtils.network(
    config.method?.toUpperCase() || 'GET',
    config.url || '',
    undefined,
    undefined
  );
  
  return config;
};

// Response interceptor
const responseInterceptor = (response: AxiosResponse) => {
  const duration = Date.now() - (response.config.metadata?.startTime || 0);
  
  DebugUtils.network(
    response.config.method?.toUpperCase() || 'GET',
    response.config.url || '',
    response.status,
    duration
  );
  
  // Add debugging for user endpoint
  if (response.config.url?.includes('/users/me')) {
    DebugUtils.log('🔍 [API INTERCEPTOR] User endpoint response:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
  }
  
  return response;
};

// Error interceptor
const errorInterceptor = (error: AxiosError) => {
  const duration = Date.now() - (error.config?.metadata?.startTime || 0);
  
  DebugUtils.network(
    error.config?.method?.toUpperCase() || 'GET',
    error.config?.url || '',
    error.response?.status,
    duration
  );
  
  // Only log 401 errors in development, suppress them in production
  if (error.response?.status !== 401) {
    DebugUtils.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
  }
  
  return Promise.reject(error);
};

// Create axios instance
const apiClient: AxiosInstance = axios.create(API_CONFIG);

// Add interceptors
apiClient.interceptors.request.use(requestInterceptor);
apiClient.interceptors.response.use(responseInterceptor, errorInterceptor);

// Auth token management
let authToken: string | null = null;

export const getAuthToken = (): string | null => {
  return authToken;
};

export const setAuthToken = (token: string | null): void => {
  authToken = token;
  DebugUtils.log('Auth token updated:', token ? 'Set' : 'Cleared');
};

// Clear auth token
export const clearAuthToken = (): void => {
  authToken = null;
  DebugUtils.log('Auth token cleared');
};

// API Methods
export const api = {
  // GET request
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // POST request
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // PUT request
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // PATCH request
  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // DELETE request
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Upload file
  upload: async <T = any>(url: string, file: File | FormData, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const formData = file instanceof FormData ? file : new FormData();
      if (file instanceof File) {
        formData.append('file', file);
      }
      
      const response = await apiClient.post<T>(url, formData, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...config?.headers,
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Download file
  download: async (url: string, filename?: string): Promise<void> => {
    try {
      const response = await apiClient.get(url, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// Error handling
const handleApiError = (error: any): Error => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    const message = data?.message || data?.detail || `HTTP ${status} Error`;
    
    // Only log 401 errors in development, suppress them in production
    if (status !== 401) {
      DebugUtils.error('API Error Response:', {
        status,
        message,
        data,
      });
    }
    
    return new Error(message);
  } else if (error.request) {
    // Request was made but no response received
    DebugUtils.error('API Network Error:', error.message);
    return new Error('Network error - please check your connection');
  } else {
    // Something else happened
    DebugUtils.error('API Error:', error.message);
    return new Error(error.message || 'An unexpected error occurred');
  }
};

// Retry logic
export const withRetry = async <T>(
  apiCall: () => Promise<T>,
  retries: number = API_CONFIG.retryAttempts
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    if (retries > 0) {
      DebugUtils.warn(`API call failed, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay));
      return withRetry(apiCall, retries - 1);
    }
    throw error;
  }
};

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    await api.get('/health');
    DebugUtils.log('API health check: ✅ Healthy');
    return true;
  } catch (error) {
    DebugUtils.error('API health check: ❌ Unhealthy', error);
    return false;
  }
};

// Export the axios instance for advanced usage
export { apiClient };

// Note: routineService is imported directly where needed to avoid circular dependency

// Export default
export default api;
