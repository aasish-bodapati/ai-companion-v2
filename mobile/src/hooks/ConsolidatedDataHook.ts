/**
 * Consolidated Data Hook
 * 
 * Combines:
 * - useDataFetch (data fetching with caching)
 * - useAsyncData (async data management)
 * - useCachedData (caching logic)
 * - usePollingData (polling functionality)
 * - useLazyData (lazy loading)
 * - useLoadingState (loading state management)
 * - useProgressMetrics (progress tracking)
 * - useWeeklyActivity (weekly activity data)
 * - useStepsTracking (step tracking)
 * - useTodaysWorkout (today's workout data)
 * - useActiveRoutine (active routine management)
 * - useBodyTypeGoalMetrics (body type metrics)
 * - useBodyTypeScoring (body type scoring)
 * - useWeather (weather data)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DebugUtils } from '../utils/debugUtils';

// ===== TYPES =====

export interface DataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  isStale: boolean;
}

export interface DataOptions {
  cacheKey?: string;
  cacheDuration?: number; // in milliseconds
  pollingInterval?: number; // in milliseconds
  retryCount?: number;
  retryDelay?: number;
  staleTime?: number; // in milliseconds
  enabled?: boolean;
}

export interface ProgressMetrics {
  weight: {
    current: number;
    target: number;
    change: number;
    change_percentage: number;
  };
  body_fat: {
    current: number;
    target: number;
    change: number;
    change_percentage: number;
  };
  muscle_mass: {
    current: number;
    target: number;
    change: number;
    change_percentage: number;
  };
  bmi: {
    current: number;
    target: number;
    change: number;
    change_percentage: number;
  };
  overall_progress: number;
  goals_completed: number;
  goals_total: number;
}

export interface WeeklyActivity {
  week_start: string;
  week_end: string;
  workouts_completed: number;
  total_duration: number;
  calories_burned: number;
  average_mood: number;
  goals_achieved: number;
  streak_days: number;
}

export interface StepsData {
  today: number;
  weekly_average: number;
  monthly_average: number;
  goal: number;
  progress_percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  wind_speed: number;
  uv_index: number;
  country: string;
}

export interface TodaysWorkout {
  routine_id: string;
  routine_name: string;
  exercises: Array<{
    exercise_id: string;
    exercise_name: string;
    sets: number;
    reps: number;
    weight?: number;
    completed: boolean;
  }>;
  total_duration?: number;
  completed_at?: string;
}

export interface ActiveRoutine {
  id: string;
  name: string;
  description?: string;
  exercises: Array<{
    exercise_id: string;
    exercise_name: string;
    sets: number;
    reps: number;
    weight?: number;
  }>;
  duration_minutes?: number;
  difficulty?: string;
  is_active?: boolean;
}

export interface BodyTypeMetrics {
  bmi: number;
  body_fat_percentage: number;
  muscle_mass: number;
  target_bmi: number;
  target_body_fat: number;
  target_muscle_mass: number;
  progress: {
    bmi_progress: number;
    body_fat_progress: number;
    muscle_mass_progress: number;
  };
}

// ===== CONSOLIDATED DATA HOOK =====

export function useData<T>(
  fetchFn: () => Promise<T>,
  options: DataOptions = {}
): DataState<T> & {
  refetch: () => Promise<void>;
  clearCache: () => void;
  setData: (data: T) => void;
} {
  const {
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes
    pollingInterval,
    retryCount = 3,
    retryDelay = 1000,
    staleTime = 10 * 60 * 1000, // 10 minutes
    enabled = true
  } = options;

  const [state, setState] = useState<DataState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
    isStale: false
  });

  const retryCountRef = useRef(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cache management
  const getCachedData = useCallback(async (): Promise<T | null> => {
    if (!cacheKey) return null;
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        if (now - timestamp < cacheDuration) {
          return data;
        }
      }
    } catch (error) {
      DebugUtils.error('Failed to get cached data:', error);
    }
    return null;
  }, [cacheKey, cacheDuration]);

  const setCachedData = useCallback(async (data: T) => {
    if (!cacheKey) return;
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      DebugUtils.error('Failed to cache data:', error);
    }
  }, [cacheKey]);

  const clearCache = useCallback(async () => {
    if (!cacheKey) return;
    try {
      await AsyncStorage.removeItem(cacheKey);
    } catch (error) {
      DebugUtils.error('Failed to clear cache:', error);
    }
  }, [cacheKey]);

  // Fetch function with retry logic
  const fetchData = useCallback(async (): Promise<void> => {
    if (!enabled) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Try cache first
      const cachedData = await getCachedData();
      if (cachedData) {
        setState(prev => ({
          ...prev,
          data: cachedData,
          loading: false,
          lastUpdated: Date.now(),
          isStale: false
        }));
      }

      // Fetch fresh data
      const data = await fetchFn();
      const now = Date.now();

      setState(prev => ({
        ...prev,
        data,
        loading: false,
        error: null,
        lastUpdated: now,
        isStale: false
      }));

      // Cache the data
      await setCachedData(data);
      retryCountRef.current = 0;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++;
        setTimeout(() => {
          fetchData();
        }, retryDelay * retryCountRef.current);
        return;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  }, [fetchFn, enabled, getCachedData, setCachedData, retryCount, retryDelay]);

  // Set data manually
  const setData = useCallback((data: T) => {
    setState(prev => ({
      ...prev,
      data,
      lastUpdated: Date.now(),
      isStale: false
    }));
    setCachedData(data);
  }, [setCachedData]);

  // Refetch function
  const refetch = useCallback(async () => {
    retryCountRef.current = 0;
    await fetchData();
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling
  useEffect(() => {
    if (pollingInterval && enabled) {
      pollingIntervalRef.current = setInterval(() => {
        fetchData();
      }, pollingInterval);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [pollingInterval, enabled, fetchData]);

  // Stale data check
  useEffect(() => {
    if (state.lastUpdated) {
      const now = Date.now();
      const isStale = now - state.lastUpdated > staleTime;
      setState(prev => ({ ...prev, isStale }));
    }
  }, [state.lastUpdated, staleTime]);

  return {
    ...state,
    refetch,
    clearCache,
    setData
  };
}

// ===== SPECIALIZED DATA HOOKS =====

export function useProgressMetrics() {
  return useData<ProgressMetrics>(
    async () => {
      // This would call the appropriate service
      const response = await fetch('/api/v1/health/progress-metrics');
      return response.json();
    },
    {
      cacheKey: 'progress_metrics',
      cacheDuration: 30 * 60 * 1000, // 30 minutes
      staleTime: 15 * 60 * 1000 // 15 minutes
    }
  );
}

export function useWeeklyActivity() {
  return useData<WeeklyActivity[]>(
    async () => {
      const response = await fetch('/api/v1/health/weekly-activity');
      return response.json();
    },
    {
      cacheKey: 'weekly_activity',
      cacheDuration: 60 * 60 * 1000, // 1 hour
      staleTime: 30 * 60 * 1000 // 30 minutes
    }
  );
}

export function useStepsTracking() {
  return useData<StepsData>(
    async () => {
      const response = await fetch('/api/v1/health/steps');
      return response.json();
    },
    {
      cacheKey: 'steps_data',
      cacheDuration: 5 * 60 * 1000, // 5 minutes
      pollingInterval: 2 * 60 * 1000, // Poll every 2 minutes
      staleTime: 10 * 60 * 1000 // 10 minutes
    }
  );
}

export function useTodaysWorkout() {
  return useData<TodaysWorkout>(
    async () => {
      const response = await fetch('/api/v1/fitness/todays-workout');
      return response.json();
    },
    {
      cacheKey: 'todays_workout',
      cacheDuration: 10 * 60 * 1000, // 10 minutes
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );
}

export function useActiveRoutine() {
  return useData<ActiveRoutine>(
    async () => {
      const response = await fetch('/api/v1/fitness/active-routine');
      return response.json();
    },
    {
      cacheKey: 'active_routine',
      cacheDuration: 30 * 60 * 1000, // 30 minutes
      staleTime: 15 * 60 * 1000 // 15 minutes
    }
  );
}

export function useWeather() {
  return useData<WeatherData>(
    async () => {
      const response = await fetch('/api/v1/weather/current');
      return response.json();
    },
    {
      cacheKey: 'weather_data',
      cacheDuration: 30 * 60 * 1000, // 30 minutes
      staleTime: 15 * 60 * 1000 // 15 minutes
    }
  );
}

export function useBodyTypeMetrics() {
  return useData<BodyTypeMetrics>(
    async () => {
      const response = await fetch('/api/v1/health/body-type-metrics');
      return response.json();
    },
    {
      cacheKey: 'body_type_metrics',
      cacheDuration: 60 * 60 * 1000, // 1 hour
      staleTime: 30 * 60 * 1000 // 30 minutes
    }
  );
}

// ===== UTILITY HOOKS =====

export function useLazyData<T>(
  fetchFn: () => Promise<T>,
  options: DataOptions = {}
) {
  const [shouldFetch, setShouldFetch] = useState(false);
  
  const dataHook = useData(
    shouldFetch ? fetchFn : () => Promise.resolve(null as T),
    { ...options, enabled: shouldFetch }
  );

  const triggerFetch = useCallback(() => {
    setShouldFetch(true);
  }, []);

  return {
    ...dataHook,
    triggerFetch,
    isReady: shouldFetch
  };
}

export function usePollingData<T>(
  fetchFn: () => Promise<T>,
  interval: number,
  options: DataOptions = {}
) {
  return useData(fetchFn, {
    ...options,
    pollingInterval: interval
  });
}
