/**
 * Simple Exercise Categories Store
 * Just reference data - no complex state management needed
 */

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { exerciseCategoryService } from '../services/api';
import { DebugUtils } from '../utils/debugUtils';

// Simple category interface
export interface ExerciseCategory {
  id: string;
  name: string;
  display_name: string;
  color: string;
  icon: string;
}

interface ExerciseCategoriesStore {
  categories: ExerciseCategory[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  
  // Actions
  loadCategories: () => Promise<void>;
  getCategoryById: (id: string) => ExerciseCategory | null;
  reset: () => void;
}

const initialState = {
  categories: [],
  loading: false,
  error: null,
  loaded: false,
};

export const useExerciseCategoriesStore = create<ExerciseCategoriesStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        loadCategories: async () => {
          const state = get();
          
          // Return cached data if already loaded
          if (state.loaded) {
            return;
          }

          // Prevent multiple simultaneous calls
          if (state.loading) {
            return;
          }

          try {
            set({ loading: true, error: null });
            
            const categories = await exerciseCategoryService.getCategories();
            
            set({
              categories,
              loaded: true,
              loading: false,
            });

            DebugUtils.log('✅ [EXERCISE CATEGORIES] Loaded successfully');
          } catch (error) {
            DebugUtils.error('❌ [EXERCISE CATEGORIES] Error loading:', error);
            set({
              error: 'Failed to load exercise categories',
              loading: false,
            });
          }
        },

        getCategoryById: (id: string) => {
          const state = get();
          return state.categories.find(cat => cat.id === id) || null;
        },

        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'exercise-categories-store',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          categories: state.categories,
          loaded: state.loaded,
          // Don't persist loading/error states
          loading: false,
          error: null,
        }),
      }
    ),
    {
      name: 'exercise-categories-store',
    }
  )
);

// Simple selector hooks with shallow comparison
export const useExerciseCategories = () => useExerciseCategoriesStore((state) => state.categories, shallow);
export const useExerciseCategoriesLoading = () => useExerciseCategoriesStore((state) => state.loading, shallow);
export const useExerciseCategoriesError = () => useExerciseCategoriesStore((state) => state.error, shallow);
export const useExerciseCategoriesLoaded = () => useExerciseCategoriesStore((state) => state.loaded, shallow);
