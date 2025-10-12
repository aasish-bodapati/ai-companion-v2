/**
 * Combined store exports
 * Centralized access to all Zustand stores
 */

// Export all stores
export { useAppStore } from './appStore';
export { useNutritionStore } from './nutritionStore';
export { useFitnessStore } from './fitnessStore';
// export { useAnalyticsStore } from './analyticsStore'; // REMOVED
export { useExerciseCategoriesStore } from './exerciseCategoriesStore';

// Export all types
export * from './types';

// Export selector hooks
export {
  useUser,
  useProgressMetrics,
  useAchievements,
  useStreaks,
  useAIInsights,
  useAppLoading,
  useAppError,
  useAppLastUpdated,
} from './appStore';

export {
  useNutritionTodayStats,
  useNutritionWeekStats,
  useRecentMeals,
  useNutritionLoading,
  useNutritionError,
  useNutritionLastUpdated,
  useNutritionActions,
} from './nutritionStore';

export {
  useFitnessTodayStats,
  useFitnessWeekStats,
  useRecentWorkouts,
  useFitnessLoading,
  useFitnessError,
  useFitnessLastUpdated,
  useFitnessActions,
} from './fitnessStore';

// Analytics store exports removed


export {
  useExerciseCategories,
  useExerciseCategoriesLoading,
  useExerciseCategoriesError,
  useExerciseCategoriesLoaded,
  useExerciseCategoriesLastUpdated,
  useExerciseCategoriesActions,
  useExerciseCategoriesWithAutoLoad,
} from './exerciseCategoriesStore';

// Combined refresh function that refreshes all stores
export const refreshAllStores = async () => {
  try {
    // Use Promise.all to refresh all stores concurrently
    await Promise.all([
      useAppStore.getState().refreshData(),
      useNutritionStore.getState().refreshNutritionData(),
      useFitnessStore.getState().refreshFitnessData(),
      useExerciseCategoriesStore.getState().refreshCategories(),
    ]);
  } catch (error) {
    console.error('❌ [STORE REFRESH] Error refreshing stores:', error);
    throw error;
  }
};

// Combined reset function that resets all stores
export const resetAllStores = () => {
  try {
    // Reset all stores synchronously
    useAppStore.getState().resetState();
    useNutritionStore.getState().resetNutritionState();
    useFitnessStore.getState().resetFitnessState();
    useExerciseCategoriesStore.getState().resetExerciseCategoriesState();
  } catch (error) {
    console.error('❌ [STORE RESET] Error resetting stores:', error);
    throw error;
  }
};
