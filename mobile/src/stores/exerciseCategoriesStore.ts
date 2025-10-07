/**
 * Exercise Categories store using Zustand
 * Manages exercise categories data and provides centralized access
 */

import React from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { ExerciseCategoriesStore, ExerciseCategory } from './types';
import { exerciseCategoryService } from '../services/exerciseCategoryService';

// Initial state
const initialState = {
  categories: [],
  loading: false,
  error: null,
  lastUpdated: null,
  loaded: false,
};

// Create the exercise categories store
export const useExerciseCategoriesStore = create<ExerciseCategoriesStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Basic setters
      setCategories: (categories) => set({ categories }, false, 'setCategories'),
      setLoading: (loading) => set({ loading }, false, 'setLoading'),
      setError: (error) => set({ error, loading: false }, false, 'setError'),
      setLoaded: (loaded) => set({ loaded }, false, 'setLoaded'),

      // Load categories
      loadCategories: async () => {
        const { setLoading, setError, setCategories, setLoaded, loaded } = get();
        
        // If already loaded, return cached data
        if (loaded) {
          return get().categories;
        }

        try {
          setLoading(true);
          setError(null);

          const categories = await exerciseCategoryService.getCategories();
          
          setCategories(categories);
          setLoaded(true);
          set({ lastUpdated: new Date().toISOString() }, false, 'loadCategories');

          return categories;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load exercise categories';
          setError(errorMessage);
          console.error('Exercise categories store load error:', error);
          throw error;
        } finally {
          setLoading(false);
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

// Actions selector
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

// Convenience hook that automatically loads categories if not loaded
export const useExerciseCategoriesWithAutoLoad = () => {
  const categories = useExerciseCategories();
  const loading = useExerciseCategoriesLoading();
  const error = useExerciseCategoriesError();
  const loaded = useExerciseCategoriesLoaded();
  const { loadCategories } = useExerciseCategoriesActions();

  // Auto-load if not loaded and not loading
  React.useEffect(() => {
    if (!loaded && !loading) {
      loadCategories();
    }
  }, [loaded, loading, loadCategories]);

  return {
    categories,
    loading,
    error,
    loaded,
    loadCategories,
  };
};
