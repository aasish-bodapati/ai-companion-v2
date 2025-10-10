import { useState, useEffect, useCallback } from 'react';
import { routineService } from '../services/routineService';

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
      
      console.log('🔄 [USE TODAYS WORKOUT] Loading today\'s workout...');
      const workoutData = await routineService.getTodaysWorkout();
      console.log('📋 [USE TODAYS WORKOUT] Workout data:', workoutData);
      
      if (workoutData) {
        setTodaysWorkout(workoutData as TodaysWorkout);
        console.log('✅ [USE TODAYS WORKOUT] Set workout data');
      } else {
        setTodaysWorkout(null);
        console.log('❌ [USE TODAYS WORKOUT] No workout data');
      }
    } catch (err) {
      console.error('❌ [USE TODAYS WORKOUT] Error:', err);
      setError('Failed to load today\'s workout');
      setTodaysWorkout(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshWorkout = useCallback(async () => {
    await loadTodaysWorkout();
  }, [loadTodaysWorkout]);

  useEffect(() => {
    console.log('🔄 [USE TODAYS WORKOUT] Effect triggered - activeRoutineId:', activeRoutineId);
    loadTodaysWorkout();
  }, [loadTodaysWorkout, activeRoutineId]);

  return {
    todaysWorkout,
    loading,
    error,
    refreshWorkout,
  };
}
