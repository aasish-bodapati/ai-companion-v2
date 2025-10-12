/**
 * Fitness store using Zustand
 * Manages all fitness-related state and actions
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { FitnessStore } from './types';
import { fitnessService } from '../services/fitnessService';

// Initial state
const initialState = {
  todayStats: null,
  weekStats: null,
  recentWorkouts: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

// Create the fitness store with persistence
export const useFitnessStore = create<FitnessStore>()(
  devtools(
    persist(
      (set, get) => ({
      ...initialState,

      // Basic setters
      setTodayStats: (todayStats) => set({ todayStats }, false, 'setTodayStats'),
      setWeekStats: (weekStats) => set({ weekStats }, false, 'setWeekStats'),
      setRecentWorkouts: (recentWorkouts) => set({ recentWorkouts }, false, 'setRecentWorkouts'),
      setLoading: (loading) => set({ loading }, false, 'setLoading'),
      setError: (error) => set({ error, loading: false }, false, 'setError'),

      // Workout management
      addWorkout: (workout) => 
        set((state) => ({
          recentWorkouts: [workout, ...state.recentWorkouts],
          lastUpdated: new Date().toISOString(),
        }), false, 'addWorkout'),

      updateWorkout: (id, updatedWorkout) =>
        set((state) => ({
          recentWorkouts: state.recentWorkouts.map(workout =>
            workout.id === id ? { ...workout, ...updatedWorkout } : workout
          ),
          lastUpdated: new Date().toISOString(),
        }), false, 'updateWorkout'),

      deleteWorkout: (id) =>
        set((state) => ({
          recentWorkouts: state.recentWorkouts.filter(workout => workout.id !== id),
          lastUpdated: new Date().toISOString(),
        }), false, 'deleteWorkout'),

      // Data refresh
      refreshFitnessData: async () => {
        const { setLoading, setError, setTodayStats, setWeekStats, setRecentWorkouts } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          // Load today's stats
          const todayStats = await fitnessService.getFitnessStats('day');
          setTodayStats(todayStats);
          
          // Load week's stats
          const weekStats = await fitnessService.getFitnessStats('week');
          setWeekStats(weekStats);
          
          // Load recent workouts
          const recentWorkouts = await fitnessService.getFitnessLogs({ limit: 10 });
          setRecentWorkouts(recentWorkouts);
          
          set({ lastUpdated: new Date().toISOString() }, false, 'refreshFitnessData');
        } catch (error) {
          console.error('Error refreshing fitness data:', error);
          setError('Failed to refresh fitness data');
        } finally {
          setLoading(false);
        }
      },

      // Reset state
      resetFitnessState: () => set(initialState, false, 'resetFitnessState'),
    }),
    {
      name: 'fitness-store-persist',
      partialize: (state) => ({
        todayStats: state.todayStats,
        weekStats: state.weekStats,
        recentWorkouts: state.recentWorkouts,
        lastUpdated: state.lastUpdated,
      }),
    }
  ),
  {
    name: 'fitness-store',
  }
)
);

// Selector hooks for better performance with shallow comparison
export const useFitnessTodayStats = () => useFitnessStore((state) => state.todayStats, shallow);

export const useFitnessWeekStats = () => useFitnessStore((state) => state.weekStats, shallow);

export const useRecentWorkouts = () => useFitnessStore((state) => state.recentWorkouts, shallow);

export const useFitnessLoading = () => useFitnessStore((state) => state.loading);

export const useFitnessError = () => useFitnessStore((state) => state.error, shallow);

export const useFitnessLastUpdated = () => useFitnessStore((state) => state.lastUpdated);

// Action hooks with shallow comparison to prevent infinite loops
export const useFitnessActions = () => useFitnessStore((state) => ({
  setTodayStats: state.setTodayStats,
  setWeekStats: state.setWeekStats,
  setRecentWorkouts: state.setRecentWorkouts,
  addWorkout: state.addWorkout,
  updateWorkout: state.updateWorkout,
  deleteWorkout: state.deleteWorkout,
  setLoading: state.setLoading,
  setError: state.setError,
  refreshFitnessData: state.refreshFitnessData,
  resetFitnessState: state.resetFitnessState,
}), shallow);
