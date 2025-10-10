import { useState, useEffect, useCallback } from 'react';
import { routineService } from '../services/routineService';

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

  const loadActiveRoutine = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 [USE ACTIVE ROUTINE] Loading active routine...');
      const activeRoutine = await routineService.getActiveRoutine();
      console.log('📋 [USE ACTIVE ROUTINE] Active routine response:', activeRoutine);
      
      if (activeRoutine) {
        console.log('🔄 [USE ACTIVE ROUTINE] Setting activeRoutineId from', activeRoutineId, 'to', activeRoutine.id);
        setActiveRoutineId(activeRoutine.id);
        console.log('✅ [USE ACTIVE ROUTINE] Set active routine ID:', activeRoutine.id);
      } else {
        console.log('🔄 [USE ACTIVE ROUTINE] Setting activeRoutineId from', activeRoutineId, 'to null');
        setActiveRoutineId(null);
        console.log('❌ [USE ACTIVE ROUTINE] No active routine found');
      }
    } catch (err) {
      console.error('❌ [USE ACTIVE ROUTINE] Error loading active routine:', err);
      setError('Failed to load active routine');
      setActiveRoutineId(null);
    } finally {
      setLoading(false);
    }
  }, []);

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
