import { useState, useCallback } from 'react';


/**
 * Hook for managing loading states
 * Provides a clean API for handling loading states with error handling
 */
export const useLoadingState = (initialLoading = false) => {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  const startLoading = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setLoading(false);
  }, []);

  const setErrorState = useCallback((errorMessage: string | null) => {
    setError(errorMessage);
    setLoading(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  const withLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    onError?: (error: Error) => void
  ): Promise<T | null> => {
    try {
      startLoading();
      const result = await asyncFn();
      stopLoading();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setErrorState(error.message);
      onError?.(error);
      return null;
    }
  }, [startLoading, stopLoading, setErrorState]);

  return {
    loading,
    error,
    setLoading,
    startLoading,
    stopLoading,
    setError,
    setErrorState,
    clearError,
    reset,
    withLoading,
  };
};

export default useLoadingState;
