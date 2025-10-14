import { useState, useCallback } from 'react';
// Removed Zustand store imports

interface HealthLoggerOptions {
  type: 'workout' | 'meal' | 'water' | 'mood';
  onSuccess?: (data: unknown) => void;
  onError?: (error: string) => void;
}

export function useHealthLogger({ type, onSuccess, onError }: HealthLoggerOptions) {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  // Removed Zustand store usage

  const openLogger = useCallback(() => {
    setIsVisible(true);
  }, []);

  const closeLogger = useCallback(() => {
    setIsVisible(false);
  }, []);

  const saveData = useCallback(async (data: unknown) => {
    try {
      setLoading(true);

      // Here you would call the appropriate service based on type
      // For now, we'll just simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Removed Zustand store usage - data refresh handled by individual components

      onSuccess?.(data);
      closeLogger();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save data';
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [type]); // Only depend on type to prevent infinite loops

  return {
    isVisible,
    loading,
    openLogger,
    closeLogger,
    saveData,
  };
}
