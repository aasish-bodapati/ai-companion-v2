import { useState, useEffect, useCallback } from 'react';

import { fitnessService } from '../services/api';

import { DebugUtils } from '../utils/debugUtils';

export interface WeeklyActivityData {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export function useWeeklyActivity() {
  const [weeklyActivityData, setWeeklyActivityData] = useState<WeeklyActivityData>({
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWeeklyActivity = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const weeklyData = await fitnessService.getFitnessStats('week');
      if (weeklyData && weeklyData.workouts) {
        // Process workouts to create weekly activity data
        const weeklyActivity: WeeklyActivityData = {
          monday: 0,
          tuesday: 0,
          wednesday: 0,
          thursday: 0,
          friday: 0,
          saturday: 0,
          sunday: 0,
        };

        // Count workouts per day
        weeklyData.workouts.forEach(workout => {
          if (workout.activity_date) {
            const dayOfWeek = new Date(workout.activity_date).getDay();
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayName = dayNames[dayOfWeek] as keyof WeeklyActivityData;
            weeklyActivity[dayName]++;
          }
        });

        setWeeklyActivityData(weeklyActivity);
      }
    } catch (err: any) {
      // Handle 404 as expected behavior (no fitness data yet)
      if (err?.response?.status === 404 || 
          err?.status === 404 || 
          (err?.data && err.data.status === 404)) {
        DebugUtils.log('ℹ️ [USE WEEKLY ACTIVITY] No fitness data available yet (404)');
        setError(null); // Clear error for expected 404
        // Set default weekly data for new users
        setWeeklyActivityData({
          monday: 0,
          tuesday: 0,
          wednesday: 0,
          thursday: 0,
          friday: 0,
          saturday: 0,
          sunday: 0,
        });
      } else {
        DebugUtils.error('❌ [USE WEEKLY ACTIVITY] Error loading weekly activity:', err);
        setError(err instanceof Error ? err.message : 'Failed to load weekly activity');

        // Set default weekly data if service fails
        setWeeklyActivityData({
          monday: 2,
          tuesday: 1,
          wednesday: 3,
          thursday: 0,
          friday: 2,
          saturday: 1,
          sunday: 0,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeeklyActivity();
  }, [loadWeeklyActivity]);

  return {
    weeklyActivityData,
    loading,
    error,
    refreshWeeklyActivity: loadWeeklyActivity,
  };
}
