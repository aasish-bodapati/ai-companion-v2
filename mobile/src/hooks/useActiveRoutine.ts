import { useState, useEffect, useCallback } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { routineService } from '../services/RoutineService';

import { DebugUtils } from '../utils/debugUtils';

const ACTIVE_ROUTINE_STORAGE_KEY = 'active_routine_id';

interface UseActiveRoutineReturn {
  activeRoutineId: number | null;
  loading: boolean;
  error: string | null;
  refreshActiveRoutine: () => Promise<void>;
}

export function useActiveRoutine(): UseActiveRoutineReturn {
  const [activeRoutineId, setActiveRoutineId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Save active routine to storage
  const saveActiveRoutine = useCallback(async (routineId: number | null) => {
    try {
      if (routineId !== null) {
        await AsyncStorage.setItem(ACTIVE_ROUTINE_STORAGE_KEY, routineId.toString());
      } else {
        await AsyncStorage.removeItem(ACTIVE_ROUTINE_STORAGE_KEY);
      }
    } catch (err) {
      DebugUtils.error('❌ [USE ACTIVE ROUTINE] Error saving to storage:', err);
    }
  }, []);

  // Load active routine from storage
  const loadFromStorage = useCallback(async (): Promise<number | null> => {
    try {
      const stored = await AsyncStorage.getItem(ACTIVE_ROUTINE_STORAGE_KEY);
      return stored ? parseInt(stored, 10) : null;
    } catch (err) {
      DebugUtils.error('❌ [USE ACTIVE ROUTINE] Error loading from storage:', err);
      return null;
    }
  }, []);

  const loadActiveRoutine = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      DebugUtils.log('🔄 [USE ACTIVE ROUTINE] Loading active routine...');

      // First, try to load from storage for immediate UI update
      const storedRoutineId = await loadFromStorage();
      if (storedRoutineId !== null) {
        setActiveRoutineId(storedRoutineId);
        DebugUtils.log('📋 [USE ACTIVE ROUTINE] Loaded from storage:', storedRoutineId);
      }

      // Then, fetch from API to ensure we have the latest data
      try {
        const activeRoutine = await routineService.getActiveRoutine();
        DebugUtils.log('📋 [USE ACTIVE ROUTINE] Active routine response:', activeRoutine);

        if (activeRoutine && activeRoutine.id) {
          DebugUtils.log('🔄 [USE ACTIVE ROUTINE] Setting activeRoutineId to', activeRoutine.id);
          setActiveRoutineId(activeRoutine.id);
          await saveActiveRoutine(activeRoutine.id);
          DebugUtils.log('✅ [USE ACTIVE ROUTINE] Set active routine ID:', activeRoutine.id);
        } else {
          DebugUtils.log('🔄 [USE ACTIVE ROUTINE] Setting activeRoutineId to null');
          setActiveRoutineId(null);
          await saveActiveRoutine(null);
          DebugUtils.log('ℹ️ [USE ACTIVE ROUTINE] No active routine found');
        }
      } catch (apiError: any) {
        // Handle 404 as expected behavior (no active routine)
        if (apiError?.response?.status === 404 || 
            apiError?.status === 404 || 
            (apiError?.data && apiError.data.status === 404)) {
          DebugUtils.log('ℹ️ [USE ACTIVE ROUTINE] No active routine set (404)');
          setActiveRoutineId(null);
          await saveActiveRoutine(null);
          setError(null); // Clear error for expected 404
        } else {
          DebugUtils.error('❌ [USE ACTIVE ROUTINE] Unexpected error:', {
            error: apiError,
            errorType: typeof apiError,
            errorKeys: apiError ? Object.keys(apiError) : 'no keys',
            errorString: String(apiError),
            errorMessage: apiError?.message || 'no message',
            errorResponse: apiError?.response || 'no response',
            errorStatus: apiError?.response?.status || 'no status'
          });
          setError('Failed to load active routine');
          setActiveRoutineId(null);
        }
      }
    } catch (err: any) {
      DebugUtils.error('❌ [USE ACTIVE ROUTINE] Error loading active routine:', err);
      setError('Failed to load active routine');
      setActiveRoutineId(null);
    } finally {
      setLoading(false);
    }
  }, []); // Remove loadFromStorage and saveActiveRoutine from dependencies to prevent infinite re-renders

  const refreshActiveRoutine = useCallback(async () => {
    DebugUtils.log('🔄 [USE ACTIVE ROUTINE] Refreshing active routine...');
    // Add a small delay to allow backend to process the change
    await new Promise(resolve => setTimeout(resolve, 500));
    await loadActiveRoutine();
    DebugUtils.log('✅ [USE ACTIVE ROUTINE] Active routine refreshed');
  }, []); // Remove loadActiveRoutine from dependencies to prevent infinite re-renders

  useEffect(() => {
    loadActiveRoutine();
  }, []); // Remove loadActiveRoutine from dependencies to prevent infinite re-renders

  // Only log when state actually changes
  if (__DEV__ && activeRoutineId !== null) {
    DebugUtils.log('🔄 [USE ACTIVE ROUTINE] Active routine:', activeRoutineId);
  }

  return {
    activeRoutineId,
    loading,
    error,
    refreshActiveRoutine,
  };
}
