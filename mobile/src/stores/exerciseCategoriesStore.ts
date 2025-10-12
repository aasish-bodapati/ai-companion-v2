/**
 * Exercise Categories store using Zustand
 * Manages exercise categories data and provides centralized access
 */

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExerciseCategoriesStore } from './types';
import { exerciseCategoryService } from '../services/exerciseCategoryService';

// Initial state
const initialState = {
  categories: [],
  loading: false,
  error: null,
  lastUpdated: null,
  loaded: false,
};

// Create the exercise categories store with persistence
export const useExerciseCategoriesStore = create<ExerciseCategoriesStore>()(
  devtools(
    persist(
      (set, get) => ({
      ...initialState,

      // Basic setters
      setCategories: (categories) => set({ categories }, false, 'setCategories'),
      setLoading: (loading) => set({ loading }, false, 'setLoading'),
      setError: (error) => set({ error, loading: false }, false, 'setError'),
      setLoaded: (loaded) => set({ loaded }, false, 'setLoaded'),

      // Load categories
      loadCategories: async () => {
        const state = get();
        
        // If already loaded, return cached data
        if (state.loaded) {
          return state.categories;
        }

        // If already loading, return current categories
        if (state.loading) {
          console.log('🔄 [EXERCISE CATEGORIES STORE] Already loading, returning current categories');
          return state.categories;
        }

        try {
          console.log('🔄 [EXERCISE CATEGORIES STORE] Loading categories from API...');
          
          // Batch all state updates into a single set() call
          set({
            loading: true,
            error: null,
          }, false, 'loadCategories_start');

          const categories = await exerciseCategoryService.getCategories();
          
          // Batch the success state updates
          set({
            categories,
            loaded: true,
            loading: false,
            lastUpdated: new Date().toISOString(),
          }, false, 'loadCategories_success');

          return categories;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load exercise categories';
          console.error('Exercise categories store load error:', error);
          
          // Batch the error state updates
          set({
            error: errorMessage,
            loading: false,
          }, false, 'loadCategories_error');
          
          throw error;
        }
      },

      // Get category by ID
      getCategoryById: (id: string) => {
        const { categories } = get();
        return categories.find(cat => cat.id === id) || null;
      },

      // Get category config (with fallback)
      getCategoryConfig: (categoryId: string) => {
        const { categories } = get();
        const category = categories.find(cat => cat.id === categoryId);
        
        if (category) {
          return category;
        }

        // Return fallback category if not found
        return {
          id: 'unknown',
          name: 'Category Not Found',
          display_name: 'Category Not Found',
          color: '#6b7280',
          icon: 'help-outline',
        };
      },

      // Check if category exists
      categoryExists: (categoryId: string) => {
        const { categories } = get();
        return categories.some(cat => cat.id === categoryId);
      },

      // Get categories by multiple IDs
      getCategoriesByIds: (ids: string[]) => {
        const { categories } = get();
        return categories.filter(cat => ids.includes(cat.id));
      },

      // Search categories by name
      searchCategories: (query: string) => {
        const { categories } = get();
        const lowercaseQuery = query.toLowerCase();
        
        return categories.filter(cat => 
          cat.name.toLowerCase().includes(lowercaseQuery) ||
          cat.display_name.toLowerCase().includes(lowercaseQuery)
        );
      },

      // Get all category IDs
      getAllCategoryIds: () => {
        const { categories } = get();
        return categories.map(cat => cat.id);
      },

      // Get categories grouped by type (if needed for UI)
      getCategoriesGrouped: () => {
        const { categories } = get();
        
        // Group by common patterns or return as-is
        return {
          all: categories,
          byType: {
            bodyweight: categories.filter(cat => cat.id === 'bodyweight'),
            weighted: categories.filter(cat => cat.id === 'weighted'),
            cardio: categories.filter(cat => cat.id === 'cardio_duration'),
            distance: categories.filter(cat => cat.id === 'distance_based'),
          }
        };
      },

      // Refresh categories (force reload)
      refreshCategories: async () => {
        const { setLoaded } = get();
        
        // Reset loaded state to force reload
        setLoaded(false);
        
        // Load categories
        return get().loadCategories();
      },

      // Reset store
      resetExerciseCategoriesState: () => set(initialState, false, 'resetExerciseCategoriesState'),
    }),
    {
      name: 'exercise-categories-store-persist',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        categories: state.categories,
        loaded: state.loaded,
        lastUpdated: state.lastUpdated,
      }),
    }
  ),
  {
    name: 'exercise-categories-store',
  }
)
);

// Selector hooks for better performance
export const useExerciseCategories = () => useExerciseCategoriesStore((state) => state.categories);
export const useExerciseCategoriesLoading = () => useExerciseCategoriesStore((state) => state.loading);
export const useExerciseCategoriesError = () => useExerciseCategoriesStore((state) => state.error);
export const useExerciseCategoriesLoaded = () => useExerciseCategoriesStore((state) => state.loaded);
export const useExerciseCategoriesLastUpdated = () => useExerciseCategoriesStore((state) => state.lastUpdated);

// Actions selector with memoized functions
export const useExerciseCategoriesActions = () => useExerciseCategoriesStore(
  (state) => ({
    loadCategories: state.loadCategories,
    getCategoryById: state.getCategoryById,
    getCategoryConfig: state.getCategoryConfig,
    categoryExists: state.categoryExists,
    getCategoriesByIds: state.getCategoriesByIds,
    searchCategories: state.searchCategories,
    getAllCategoryIds: state.getAllCategoryIds,
    getCategoriesGrouped: state.getCategoriesGrouped,
    refreshCategories: state.refreshCategories,
    resetExerciseCategoriesState: state.resetExerciseCategoriesState,
  }),
  shallow
);

// Convenience hook that provides categories with manual loading
export const useExerciseCategoriesWithAutoLoad = () => {
  return useExerciseCategoriesStore(
    (state) => ({
      categories: state.categories,
      loading: state.loading,
      error: state.error,
      loaded: state.loaded,
      loadCategories: state.loadCategories,
    }),
    shallow
  );
};
