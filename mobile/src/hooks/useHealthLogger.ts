import { useState, useCallback } from 'react';
import { useAppStore } from '../stores';

interface HealthLoggerOptions {
  type: 'workout' | 'meal' | 'water' | 'mood';
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useHealthLogger({ type, onSuccess, onError }: HealthLoggerOptions) {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { refreshData } = useAppStore();

  const openLogger = useCallback(() => {
    setIsVisible(true);
  }, []);

  const closeLogger = useCallback(() => {
    setIsVisible(false);
  }, []);

  const saveData = useCallback(async (data: any) => {
    try {
      setLoading(true);
      
      // Here you would call the appropriate service based on type
      // For now, we'll just simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh global data
      await refreshData();
      
      onSuccess?.(data);
      closeLogger();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save data';
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [type, onSuccess, onError, refreshData, closeLogger]);

  return {
    isVisible,
    loading,
    openLogger,
    closeLogger,
    saveData,
  };
}
