import { useState, useEffect, useCallback } from 'react';

import { routineService } from '../services/api';

import { DebugUtils } from '../utils/debugUtils';

interface Exercise {
  exercise_name: string;
  logging_category: string;
  sets?: number;
  reps?: string;
  duration?: number;
  distance?: number;
  difficulty?: string;
  rest_time?: string;
  notes?: string;
}

interface TodaysWorkout {
  routine_id: string | number;
  routine_name: string;
  day_name: string;
  workout_name?: string;
  description?: string;
  exercises: Exercise[];
}

interface UseTodaysWorkoutReturn {
  todaysWorkout: TodaysWorkout | null;
  loading: boolean;
  error: string | null;
  refreshWorkout: () => Promise<void>;
}

export function useTodaysWorkout(activeRoutineId?: number | null): UseTodaysWorkoutReturn {
  const [todaysWorkout, setTodaysWorkout] = useState<TodaysWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTodaysWorkout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      DebugUtils.log('🔄 [USE TODAYS WORKOUT] Loading today\'s workout...');
      const workoutData = await routineService.getTodaysWorkout();
      DebugUtils.log('📋 [USE TODAYS WORKOUT] Workout data:', workoutData);

      if (workoutData) {
        setTodaysWorkout(workoutData as TodaysWorkout);
        DebugUtils.log('✅ [USE TODAYS WORKOUT] Set workout data');
      } else {
        setTodaysWorkout(null);
        DebugUtils.log('ℹ️ [USE TODAYS WORKOUT] No workout scheduled for today');
      }
    } catch (err: any) {
      // Handle 404 as expected behavior (no workout scheduled)
      if (err?.response?.status === 404 || 
          err?.status === 404 || 
          (err?.data && err.data.status === 404)) {
        DebugUtils.log('ℹ️ [USE TODAYS WORKOUT] No workout scheduled for today (404)');
        setTodaysWorkout(null);
        setError(null); // Clear error for expected 404
      } else {
        DebugUtils.error('❌ [USE TODAYS WORKOUT] Error:', err);
        setError('Failed to load today\'s workout');
        setTodaysWorkout(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshWorkout = useCallback(async () => {
    await loadTodaysWorkout();
  }, []); // Remove loadTodaysWorkout from dependencies to prevent infinite re-renders

  useEffect(() => {
    DebugUtils.log('🔄 [USE TODAYS WORKOUT] Effect triggered - activeRoutineId:', activeRoutineId);
    loadTodaysWorkout();
  }, [activeRoutineId]); // Remove loadTodaysWorkout from dependencies to prevent infinite re-renders

  return {
    todaysWorkout,
    loading,
    error,
    refreshWorkout,
  };
}
