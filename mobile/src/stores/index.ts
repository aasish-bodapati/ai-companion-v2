/**
 * Combined store exports
 * Centralized access to all Zustand stores
 */

// Export all stores
export { useAppStore } from './appStore';
export { useNutritionStore } from './nutritionStore';
export { useFitnessStore } from './fitnessStore';
export { useAnalyticsStore } from './analyticsStore';
export { useWaterStore } from './waterStore';
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

export {
  useAnalyticsData,
  useWeeklyActivityData,
  useAnalyticsLoading,
  useAnalyticsError,
  useAnalyticsLastUpdated,
  useAnalyticsActions,
} from './analyticsStore';

export {
  useWaterTodayStats,
  useWaterWeekStats,
  useRecentWaterLogs,
  useWaterGoal,
  useWaterLoading,
  useWaterError,
  useWaterLastUpdated,
  useWaterActions,
} from './waterStore';

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
  const { refreshAnalyticsData } = useAnalyticsStore.getState();
  const { refreshWaterData } = useWaterStore.getState();
  const { loadCategories } = useExerciseCategoriesStore.getState();

  await Promise.all([
    refreshData(),
    refreshNutritionData(),
    refreshFitnessData(),
    refreshAnalyticsData(),
    refreshWaterData(),
    loadCategories(),
  ]);
};

// Combined reset function that resets all stores
export const resetAllStores = () => {
  useAppStore.getState().resetState();
  useNutritionStore.getState().resetNutritionState();
  useFitnessStore.getState().resetFitnessState();
  useAnalyticsStore.getState().resetAnalyticsState();
  useWaterStore.getState().resetWaterState();
  useExerciseCategoriesStore.getState().resetExerciseCategoriesState();
};
