import { useCallback } from 'react';
import { useErrorContext } from '../contexts/ErrorContext';

interface UseErrorHandlerOptions {
  context?: string;
  retryable?: boolean;
  onError?: (error: Error) => void;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { addError } = useErrorContext();

  const handleError = useCallback((
    error: Error | string,
    type: 'network' | 'validation' | 'permission' | 'unknown' = 'unknown',
    retryAction?: () => Promise<void>
  ) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    // Call the onError callback if provided
    if (typeof error === 'object' && options.onError) {
      options.onError(error);
    }

    // Add error to global error context
    addError({
      message: errorMessage,
      type,
      context: options.context,
      retryable: options.retryable || !!retryAction,
      retryAction,
    });
  }, [addError, options]);

  const handleNetworkError = useCallback((
    error: Error | string,
    retryAction?: () => Promise<void>
  ) => {
    handleError(error, 'network', retryAction);
  }, [handleError]);

  const handleValidationError = useCallback((
    error: Error | string
  ) => {
    handleError(error, 'validation');
  }, [handleError]);

  const handlePermissionError = useCallback((
    error: Error | string
  ) => {
    handleError(error, 'permission');
  }, [handleError]);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      handleError(errorMessage, 'unknown');
      return null;
    }
  }, [handleError]);

  return {
    handleError,
    handleNetworkError,
    handleValidationError,
    handlePermissionError,
    handleAsyncError,
  };
}

// Convenience hook for API error handling
export function useApiErrorHandler(context?: string) {
  const { handleNetworkError, handleAsyncError } = useErrorHandler({ context });

  const handleApiError = useCallback((
    error: any,
    retryAction?: () => Promise<void>
  ) => {
    let errorMessage = 'Network error occurred';
    let errorType: 'network' | 'unknown' = 'network';

    if (error?.response?.status) {
      const status = error.response.status;
      if (status >= 400 && status < 500) {
        errorMessage = `Client error (${status})`;
        errorType = 'unknown';
      } else if (status >= 500) {
        errorMessage = `Server error (${status})`;
        errorType = 'network';
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }

    handleNetworkError(errorMessage, retryAction);
  }, [handleNetworkError]);

  const withApiErrorHandling = useCallback(async <T>(
    apiCall: () => Promise<T>,
    retryAction?: () => Promise<void>
  ): Promise<T | null> => {
    try {
      return await apiCall();
    } catch (error) {
      handleApiError(error, retryAction);
      return null;
    }
  }, [handleApiError]);

  return {
    handleApiError,
    withApiErrorHandling,
    handleAsyncError,
  };
}

export default useErrorHandler;
