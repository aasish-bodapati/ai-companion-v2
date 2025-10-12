/**
 * Utilities to help reduce code duplication
 * Safe, non-breaking utilities that can be adopted gradually
 */

import { useState, useCallback } from 'react';


import { DebugUtils } from '../utils/debugUtils';

// Custom hook for loading state management
export const useLoadingState = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withLoading = useCallback(async (fn: () => Promise<unknown>) => {
    try {
      setLoading(true);
      setError(null);
      return await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return { loading, error, withLoading, resetError };
};

export const DuplicateCodeUtils = {

  // Safe error handling
  handleError: (error: unknown, context: string) => {
    DebugUtils.error(`Error in ${context}:`, error);
    // Don't change existing error handling yet
    // This is just a placeholder for future improvements
  },

  // Safe common styles (as functions, not constants)
  getCommonStyles: () => ({
    screenBackground: {
      backgroundColor: '#f8fafc',
    },
    cardContainer: {
      backgroundColor: '#f8fafc',
      borderRadius: 16,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
    },
    standardPadding: {
      paddingHorizontal: 20,
    },
  }),

  // Safe API call wrapper
  createApiCall: (apiFunction: () => Promise<unknown>) => {
    return async () => {
      try {
        return await apiFunction();
      } catch (error) {
        DebugUtils.error('API call failed:', error);
        throw error;
      }
    };
  },

  // Safe form validation
  validateRequired: (value: string | number | undefined, fieldName: string) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} is required`;
    }
    return null;
  },

  // Safe number validation
  validateNumber: (value: string | number, fieldName: string, min?: number, max?: number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(num)) {
      return `${fieldName} must be a valid number`;
    }

    if (min !== undefined && num < min) {
      return `${fieldName} must be at least ${min}`;
    }

    if (max !== undefined && num > max) {
      return `${fieldName} must be at most ${max}`;
    }

    return null;
  },
};

// Export individual functions for convenience
export const {
  handleError,
  getCommonStyles,
  createApiCall,
  validateRequired,
  validateNumber
} = DuplicateCodeUtils;

// Export createLoadingState as a factory function that returns a hook
export const createLoadingState = () => {
  return () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const withLoading = useCallback(async (fn: () => Promise<unknown>) => {
      try {
        setLoading(true);
        setError(null);
        return await fn();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        throw err;
      } finally {
        setLoading(false);
      }
    }, []);

    const resetError = useCallback(() => {
      setError(null);
    }, []);

    return { loading, error, setLoading, withLoading, resetError };
  };
};

// Also export as a direct hook for convenience
export const useCreateLoadingState = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withLoading = useCallback(async (fn: () => Promise<unknown>) => {
    try {
      setLoading(true);
      setError(null);
      return await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return { loading, error, setLoading, withLoading, resetError };
};