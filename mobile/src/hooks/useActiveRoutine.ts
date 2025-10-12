import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { routineService } from '../services/routineService';

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
      console.error('❌ [USE ACTIVE ROUTINE] Error saving to storage:', err);
    }
  }, []);

  // Load active routine from storage
  const loadFromStorage = useCallback(async (): Promise<number | null> => {
    try {
      const stored = await AsyncStorage.getItem(ACTIVE_ROUTINE_STORAGE_KEY);
      return stored ? parseInt(stored, 10) : null;
    } catch (err) {
      console.error('❌ [USE ACTIVE ROUTINE] Error loading from storage:', err);
      return null;
    }
  }, []);

  const loadActiveRoutine = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 [USE ACTIVE ROUTINE] Loading active routine...');
      
      // First, try to load from storage for immediate UI update
      const storedRoutineId = await loadFromStorage();
      if (storedRoutineId !== null) {
        setActiveRoutineId(storedRoutineId);
        console.log('📋 [USE ACTIVE ROUTINE] Loaded from storage:', storedRoutineId);
      }
      
      // Then, fetch from API to ensure we have the latest data
      const activeRoutine = await routineService.getActiveRoutine();
      console.log('📋 [USE ACTIVE ROUTINE] Active routine response:', activeRoutine);
      
      if (activeRoutine) {
        console.log('🔄 [USE ACTIVE ROUTINE] Setting activeRoutineId from', activeRoutineId, 'to', activeRoutine.id);
        setActiveRoutineId(activeRoutine.id);
        await saveActiveRoutine(activeRoutine.id);
        console.log('✅ [USE ACTIVE ROUTINE] Set active routine ID:', activeRoutine.id);
      } else {
        console.log('🔄 [USE ACTIVE ROUTINE] Setting activeRoutineId from', activeRoutineId, 'to null');
        setActiveRoutineId(null);
        await saveActiveRoutine(null);
        console.log('❌ [USE ACTIVE ROUTINE] No active routine found');
      }
    } catch (err) {
      console.error('❌ [USE ACTIVE ROUTINE] Error loading active routine:', err);
      setError('Failed to load active routine');
      setActiveRoutineId(null);
    } finally {
      setLoading(false);
    }
  }, [loadFromStorage, saveActiveRoutine]);

  const refreshActiveRoutine = useCallback(async () => {
    console.log('🔄 [USE ACTIVE ROUTINE] Refreshing active routine...');
    await loadActiveRoutine();
    console.log('✅ [USE ACTIVE ROUTINE] Active routine refreshed');
  }, [loadActiveRoutine]);

  useEffect(() => {
    loadActiveRoutine();
  }, [loadActiveRoutine]);

  console.log('🔄 [USE ACTIVE ROUTINE] Returning activeRoutineId:', activeRoutineId, 'loading:', loading);
  
  return {
    activeRoutineId,
    loading,
    error,
    refreshActiveRoutine,
  };
}
