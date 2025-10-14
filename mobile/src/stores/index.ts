/**
 * Simplified Store Exports
 * Replaces complex multi-store architecture with 2 simple stores
 */

// Export the two simple stores
export { 
  useHealthStore, 
  useHealthStats, 
  useHealthActions 
} from './simpleStore';

export { 
  useExerciseCategoriesStore,
  useExerciseCategories,
  useExerciseCategoriesLoading,
  useExerciseCategoriesError,
  useExerciseCategoriesLoaded
} from './simpleExerciseStore';

// Export types
export type { HealthStats, HealthActions, ExerciseCategory } from './simpleStore';
export type { ExerciseCategory as ExerciseCategoryType } from './simpleExerciseStore';

// Simple refresh function
export const refreshAllStores = async () => {
  try {
    await Promise.all([
      useHealthStore.getState().refreshData(),
      useExerciseCategoriesStore.getState().loadCategories(),
    ]);
  } catch (error) {
    console.error('Error refreshing stores:', error);
  }
};

// Simple reset function
export const resetAllStores = () => {
  useHealthStore.getState().reset();
  useExerciseCategoriesStore.getState().reset();
};
