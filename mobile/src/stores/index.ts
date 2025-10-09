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
  const { refreshData } = useAppStore.getState();
  const { refreshNutritionData } = useNutritionStore.getState();
  const { refreshFitnessData } = useFitnessStore.getState();
  // const { refreshAnalyticsData } = useAnalyticsStore.getState(); // REMOVED
  // const { loadCategories } = useExerciseCategoriesStore.getState(); // REMOVED - causes infinite loop

  await Promise.all([
    refreshData(),
    refreshNutritionData(),
    refreshFitnessData(),
    // refreshAnalyticsData(), // REMOVED
    // loadCategories(), // REMOVED - causes infinite loop
  ]);
};

// Combined reset function that resets all stores
export const resetAllStores = () => {
  useAppStore.getState().resetState();
  useNutritionStore.getState().resetNutritionState();
  useFitnessStore.getState().resetFitnessState();
  // useAnalyticsStore.getState().resetAnalyticsState(); // REMOVED
  useExerciseCategoriesStore.getState().resetExerciseCategoriesState();
};
