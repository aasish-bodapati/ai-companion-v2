/**
 * Simple Health Store - Consolidated state management
 * Replaces complex multi-store architecture with one simple store
 */

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dashboardService } from '../services/api';
import { DebugUtils } from '../utils/debugUtils';

// Simple, flat data structures
export interface HealthStats {
  // Today's data
  workoutsToday: number;
  caloriesToday: number;
  waterToday: number; // in ml
  mealsToday: number;
  
  // Recent logs (last 7 items each)
  recentWorkouts: Array<{
    id: string;
    name: string;
    duration: number;
    calories: number;
    date: string;
  }>;
  
  recentMeals: Array<{
    id: string;
    mealType: string;
    calories: number;
    date: string;
  }>;
  
  // UI state
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// Simple store interface
interface HealthStore {
  // State
  stats: HealthStats;
  
  // Actions
  refreshData: () => Promise<void>;
  addWorkout: (workout: HealthStats['recentWorkouts'][0]) => void;
  addMeal: (meal: HealthStats['recentMeals'][0]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// Export the actions type
export type HealthActions = Pick<HealthStore, 'refreshData' | 'addWorkout' | 'addMeal' | 'setLoading' | 'setError' | 'reset'>;

// Initial state
const initialState: HealthStats = {
  workoutsToday: 0,
  caloriesToday: 0,
  waterToday: 0,
  mealsToday: 0,
  recentWorkouts: [],
  recentMeals: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

// Create the simple store
export const useHealthStore = create<HealthStore>()(
  devtools(
    persist(
      (set, get) => ({
        stats: initialState,

        // Refresh data from API
        refreshData: async () => {
          const { setLoading, setError, stats } = get();
          
          // Prevent multiple simultaneous calls
          if (stats.loading) {
            DebugUtils.log('ℹ️ [HEALTH STORE] Already loading, skipping refresh');
            return;
          }
          
          try {
            setLoading(true);
            setError(null);

            // Get dashboard data
            const dashboardData = await dashboardService.getDashboardSummary();
            
            set((state) => ({
              stats: {
                ...state.stats,
                workoutsToday: dashboardData?.today_stats?.workouts || 0,
                caloriesToday: dashboardData?.today_stats?.calories_consumed || 0,
                waterToday: dashboardData?.today_stats?.water_ml || 0,
                mealsToday: dashboardData?.today_stats?.meals || 0,
                lastUpdated: new Date().toISOString(),
              }
            }));

            DebugUtils.log('✅ [HEALTH STORE] Data refreshed successfully');
          } catch (error: any) {
            // Handle 404 as expected (no data yet)
            if (error?.response?.status === 404) {
              DebugUtils.log('ℹ️ [HEALTH STORE] No dashboard data available yet');
            } else {
              DebugUtils.error('❌ [HEALTH STORE] Error refreshing data:', error);
              setError('Failed to refresh data');
            }
          } finally {
            setLoading(false);
          }
        },

        // Add workout
        addWorkout: (workout) => {
          set((state) => ({
            stats: {
              ...state.stats,
              workoutsToday: state.stats.workoutsToday + 1,
              recentWorkouts: [workout, ...state.stats.recentWorkouts.slice(0, 6)], // Keep last 7
              lastUpdated: new Date().toISOString(),
            }
          }));
        },

        // Add meal
        addMeal: (meal) => {
          set((state) => ({
            stats: {
              ...state.stats,
              mealsToday: state.stats.mealsToday + 1,
              recentMeals: [meal, ...state.stats.recentMeals.slice(0, 6)], // Keep last 7
              lastUpdated: new Date().toISOString(),
            }
          }));
        },

        // Basic setters
        setLoading: (loading) => {
          set((state) => ({
            stats: { ...state.stats, loading }
          }));
        },

        setError: (error) => {
          set((state) => ({
            stats: { ...state.stats, error, loading: false }
          }));
        },

        // Reset to initial state
        reset: () => {
          set({ stats: initialState });
        },
      }),
      {
        name: 'health-store',
        storage: createJSONStorage(() => AsyncStorage),
        // Only persist essential data, not runtime state
        partialize: (state) => ({
          stats: {
            workoutsToday: state.stats.workoutsToday,
            caloriesToday: state.stats.caloriesToday,
            waterToday: state.stats.waterToday,
            mealsToday: state.stats.mealsToday,
            recentWorkouts: state.stats.recentWorkouts,
            recentMeals: state.stats.recentMeals,
            lastUpdated: state.stats.lastUpdated,
            // Don't persist loading/error states
            loading: false,
            error: null,
          }
        }),
      }
    ),
    {
      name: 'health-store',
    }
  )
);

// Simple selector hooks with shallow comparison
export const useHealthStats = () => useHealthStore((state) => state.stats, shallow);
export const useHealthActions = (): HealthActions => useHealthStore((state) => ({
  refreshData: state.refreshData,
  addWorkout: state.addWorkout,
  addMeal: state.addMeal,
  setLoading: state.setLoading,
  setError: state.setError,
  reset: state.reset,
}), shallow);
