/**
 * Nutrition store using Zustand
 * Manages all nutrition-related state and actions
 */

import { create } from 'zustand';

import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NutritionStore } from './types';
import { nutritionService } from '../services/api';

import { DebugUtils } from '../utils/debugUtils';

// Initial state
const initialState = {
  todayStats: null,
  weekStats: null,
  recentMeals: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

// Create the nutrition store with persistence
export const useNutritionStore = create<NutritionStore>()(
  devtools(
    persist(
      (set, get) => ({
      ...initialState,

      // Basic setters
      setTodayStats: (todayStats) => set({ todayStats }, false, 'setTodayStats'),
      setWeekStats: (weekStats) => set({ weekStats }, false, 'setWeekStats'),
      setRecentMeals: (recentMeals) => set({ recentMeals }, false, 'setRecentMeals'),
      setLoading: (loading) => set({ loading }, false, 'setLoading'),
      setError: (error) => set({ error, loading: false }, false, 'setError'),

      // Meal management
      addMeal: (meal) =>
        set((state) => ({
          recentMeals: [meal, ...state.recentMeals],
          lastUpdated: new Date().toISOString(),
        }), false, 'addMeal'),

      updateMeal: (id, updatedMeal) =>
        set((state) => ({
          recentMeals: state.recentMeals.map(meal =>
            meal.id === id ? { ...meal, ...updatedMeal } : meal
          ),
          lastUpdated: new Date().toISOString(),
        }), false, 'updateMeal'),

      deleteMeal: (id) =>
        set((state) => ({
          recentMeals: state.recentMeals.filter(meal => meal.id !== id),
          lastUpdated: new Date().toISOString(),
        }), false, 'deleteMeal'),

      // Data refresh
      refreshNutritionData: async () => {
        const { setLoading, setError, setTodayStats, setWeekStats, setRecentMeals } = get();

        try {
          setLoading(true);
          setError(null);

          // Load today's stats
          const todayStats = await nutritionService.getNutritionStats('day');
          setTodayStats(todayStats);

          // Load week's stats
          const weekStats = await nutritionService.getNutritionStats('week');
          setWeekStats(weekStats);

          // Load recent meals
          const recentMeals = await nutritionService.getNutritionLogs({ limit: 10 });
          setRecentMeals(recentMeals);

          set({ lastUpdated: new Date().toISOString() }, false, 'refreshNutritionData');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to refresh nutrition data';
          DebugUtils.error('❌ [NUTRITION STORE] Error refreshing nutrition data:', error);
          setError(`Nutrition data refresh failed: ${errorMessage}`);
        } finally {
          setLoading(false);
        }
      },

      // Reset state
      resetNutritionState: () => set(initialState, false, 'resetNutritionState'),
    }),
    {
      name: 'nutrition-store-persist',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        todayStats: state.todayStats,
        weekStats: state.weekStats,
        recentMeals: state.recentMeals,
        lastUpdated: state.lastUpdated,
      }),
    }
  ),
  {
    name: 'nutrition-store',
  }
)
);

// Selector hooks for better performance with shallow comparison
export const useNutritionTodayStats = () => useNutritionStore((state) => state.todayStats, shallow);
export const useNutritionWeekStats = () => useNutritionStore((state) => state.weekStats, shallow);
export const useRecentMeals = () => useNutritionStore((state) => state.recentMeals, shallow);
export const useNutritionLoading = () => useNutritionStore((state) => state.loading, shallow);
export const useNutritionError = () => useNutritionStore((state) => state.error, shallow);
export const useNutritionLastUpdated = () => useNutritionStore((state) => state.lastUpdated);

// Action hooks with shallow comparison to prevent infinite loops
export const useNutritionActions = () => useNutritionStore((state) => ({
  setTodayStats: state.setTodayStats,
  setWeekStats: state.setWeekStats,
  setRecentMeals: state.setRecentMeals,
  addMeal: state.addMeal,
  updateMeal: state.updateMeal,
  deleteMeal: state.deleteMeal,
  setLoading: state.setLoading,
  setError: state.setError,
  refreshNutritionData: state.refreshNutritionData,
  resetNutritionState: state.resetNutritionState,
}), shallow);
