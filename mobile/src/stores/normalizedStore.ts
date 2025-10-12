/**
 * Normalized store using entity management
 * Provides efficient data access and relationship handling
 */

import { create } from 'zustand';

import { devtools, persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import {
  EntityManager,
  RoutineManager,
  WorkoutManager,
  MealManager,
  RelationshipManager,
  NormalizedState,
  normalizeData,
  denormalizeData,
  mergeNormalizedData
} from '../utils/normalization';

// Entity interfaces
export interface RoutineEntity {
  id: number;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks: number;
  total_workouts_per_week: number;
  is_template: boolean;
  is_active: boolean;
  created_by_user_id?: number;
  created_at: string;
  updated_at: string;
  workout_schedule: any[];
  user_progress?: any;
}

export interface WorkoutEntity {
  id: number;
  user_id: number;
  routine_id?: number;
  activity_date: string;
  duration_minutes: number;
  calories_burned?: number;
  notes?: string;
  exercises: any[];
  created_at: string;
  updated_at: string;
}

export interface MealEntity {
  id: number;
  user_id: number;
  meal_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  total_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  food_items: any[];
  created_at: string;
  updated_at: string;
}

export interface ExerciseEntity {
  id: number;
  name: string;
  category: string;
  logging_category: string;
  description?: string;
  instructions?: string[];
  muscle_groups: string[];
  equipment?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface CategoryEntity {
  id: string;
  name: string;
  display_name: string;
  color: string;
  icon: string;
}

// Normalized store state
interface NormalizedStoreState {
  // Entity managers
  routines: RoutineManager;
  workouts: WorkoutManager;
  meals: MealManager;
  exercises: EntityManager<ExerciseEntity>;
  categories: EntityManager<CategoryEntity>;

  // Relationships
  relationships: RelationshipManager;

  // Loading states
  loading: {
    routines: boolean;
    workouts: boolean;
    meals: boolean;
    exercises: boolean;
    categories: boolean;
  };

  // Error states
  errors: {
    routines: string | null;
    workouts: string | null;
    meals: string | null;
    exercises: string | null;
    categories: string | null;
  };

  // Last updated timestamps
  lastUpdated: {
    routines: string | null;
    workouts: string | null;
    meals: string | null;
    exercises: string | null;
    categories: string | null;
  };
}

// Actions interface
interface NormalizedStoreActions {
  // Routine actions
  setRoutines: (routines: RoutineEntity[]) => void;
  addRoutine: (routine: RoutineEntity) => void;
  updateRoutine: (id: number, updates: Partial<RoutineEntity>) => void;
  removeRoutine: (id: number) => void;
  setRoutinesLoading: (loading: boolean) => void;
  setRoutinesError: (error: string | null) => void;

  // Workout actions
  setWorkouts: (workouts: WorkoutEntity[]) => void;
  addWorkout: (workout: WorkoutEntity) => void;
  updateWorkout: (id: number, updates: Partial<WorkoutEntity>) => void;
  removeWorkout: (id: number) => void;
  setWorkoutsLoading: (loading: boolean) => void;
  setWorkoutsError: (error: string | null) => void;

  // Meal actions
  setMeals: (meals: MealEntity[]) => void;
  addMeal: (meal: MealEntity) => void;
  updateMeal: (id: number, updates: Partial<MealEntity>) => void;
  removeMeal: (id: number) => void;
  setMealsLoading: (loading: boolean) => void;
  setMealsError: (error: string | null) => void;

  // Exercise actions
  setExercises: (exercises: ExerciseEntity[]) => void;
  addExercise: (exercise: ExerciseEntity) => void;
  updateExercise: (id: number, updates: Partial<ExerciseEntity>) => void;
  removeExercise: (id: number) => void;
  setExercisesLoading: (loading: boolean) => void;
  setExercisesError: (error: string | null) => void;

  // Category actions
  setCategories: (categories: CategoryEntity[]) => void;
  addCategory: (category: CategoryEntity) => void;
  updateCategory: (id: string, updates: Partial<CategoryEntity>) => void;
  removeCategory: (id: string) => void;
  setCategoriesLoading: (loading: boolean) => void;
  setCategoriesError: (error: string | null) => void;

  // Utility actions
  clearAll: () => void;
  resetErrors: () => void;
}

type NormalizedStore = NormalizedStoreState & NormalizedStoreActions;

// Initial state
const initialState: NormalizedStoreState = {
  routines: new RoutineManager(),
  workouts: new WorkoutManager(),
  meals: new MealManager(),
  exercises: new EntityManager<ExerciseEntity>(),
  categories: new EntityManager<CategoryEntity>(),
  relationships: new RelationshipManager(),
  loading: {
    routines: false,
    workouts: false,
    meals: false,
    exercises: false,
    categories: false,
  },
  errors: {
    routines: null,
    workouts: null,
    meals: null,
    exercises: null,
    categories: null,
  },
  lastUpdated: {
    routines: null,
    workouts: null,
    meals: null,
    exercises: null,
    categories: null,
  },
};

// Create the normalized store
export const useNormalizedStore = create<NormalizedStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Routine actions
        setRoutines: (routines: RoutineEntity[]) => {
          const state = get();
          const normalizedRoutines = normalizeData(routines);
          const mergedRoutines = mergeNormalizedData(state.routines.getState(), normalizedRoutines);
          state.routines = new RoutineManager(mergedRoutines);

          set({
            routines: state.routines,
            lastUpdated: { ...state.lastUpdated, routines: new Date().toISOString() },
          }, false, 'setRoutines');
        },

        addRoutine: (routine: RoutineEntity) => {
          const state = get();
          state.routines.addEntity(routine);
          set({
            routines: state.routines,
            lastUpdated: { ...state.lastUpdated, routines: new Date().toISOString() },
          }, false, 'addRoutine');
        },

        updateRoutine: (id: number, updates: Partial<RoutineEntity>) => {
          const state = get();
          state.routines.updateEntity(id, updates);
          set({
            routines: state.routines,
            lastUpdated: { ...state.lastUpdated, routines: new Date().toISOString() },
          }, false, 'updateRoutine');
        },

        removeRoutine: (id: number) => {
          const state = get();
          state.routines.removeEntity(id);
          set({
            routines: state.routines,
            lastUpdated: { ...state.lastUpdated, routines: new Date().toISOString() },
          }, false, 'removeRoutine');
        },

        setRoutinesLoading: (loading: boolean) => {
          set(state => ({
            loading: { ...state.loading, routines: loading },
          }), false, 'setRoutinesLoading');
        },

        setRoutinesError: (error: string | null) => {
          set(state => ({
            errors: { ...state.errors, routines: error },
          }), false, 'setRoutinesError');
        },

        // Workout actions
        setWorkouts: (workouts: WorkoutEntity[]) => {
          const state = get();
          const normalizedWorkouts = normalizeData(workouts);
          const mergedWorkouts = mergeNormalizedData(state.workouts.getState(), normalizedWorkouts);
          state.workouts = new WorkoutManager(mergedWorkouts);

          set({
            workouts: state.workouts,
            lastUpdated: { ...state.lastUpdated, workouts: new Date().toISOString() },
          }, false, 'setWorkouts');
        },

        addWorkout: (workout: WorkoutEntity) => {
          const state = get();
          state.workouts.addEntity(workout);
          set({
            workouts: state.workouts,
            lastUpdated: { ...state.lastUpdated, workouts: new Date().toISOString() },
          }, false, 'addWorkout');
        },

        updateWorkout: (id: number, updates: Partial<WorkoutEntity>) => {
          const state = get();
          state.workouts.updateEntity(id, updates);
          set({
            workouts: state.workouts,
            lastUpdated: { ...state.lastUpdated, workouts: new Date().toISOString() },
          }, false, 'updateWorkout');
        },

        removeWorkout: (id: number) => {
          const state = get();
          state.workouts.removeEntity(id);
          set({
            workouts: state.workouts,
            lastUpdated: { ...state.lastUpdated, workouts: new Date().toISOString() },
          }, false, 'removeWorkout');
        },

        setWorkoutsLoading: (loading: boolean) => {
          set(state => ({
            loading: { ...state.loading, workouts: loading },
          }), false, 'setWorkoutsLoading');
        },

        setWorkoutsError: (error: string | null) => {
          set(state => ({
            errors: { ...state.errors, workouts: error },
          }), false, 'setWorkoutsError');
        },

        // Meal actions
        setMeals: (meals: MealEntity[]) => {
          const state = get();
          const normalizedMeals = normalizeData(meals);
          const mergedMeals = mergeNormalizedData(state.meals.getState(), normalizedMeals);
          state.meals = new MealManager(mergedMeals);

          set({
            meals: state.meals,
            lastUpdated: { ...state.lastUpdated, meals: new Date().toISOString() },
          }, false, 'setMeals');
        },

        addMeal: (meal: MealEntity) => {
          const state = get();
          state.meals.addEntity(meal);
          set({
            meals: state.meals,
            lastUpdated: { ...state.lastUpdated, meals: new Date().toISOString() },
          }, false, 'addMeal');
        },

        updateMeal: (id: number, updates: Partial<MealEntity>) => {
          const state = get();
          state.meals.updateEntity(id, updates);
          set({
            meals: state.meals,
            lastUpdated: { ...state.lastUpdated, meals: new Date().toISOString() },
          }, false, 'updateMeal');
        },

        removeMeal: (id: number) => {
          const state = get();
          state.meals.removeEntity(id);
          set({
            meals: state.meals,
            lastUpdated: { ...state.lastUpdated, meals: new Date().toISOString() },
          }, false, 'removeMeal');
        },

        setMealsLoading: (loading: boolean) => {
          set(state => ({
            loading: { ...state.loading, meals: loading },
          }), false, 'setMealsLoading');
        },

        setMealsError: (error: string | null) => {
          set(state => ({
            errors: { ...state.errors, meals: error },
          }), false, 'setMealsError');
        },

        // Exercise actions
        setExercises: (exercises: ExerciseEntity[]) => {
          const state = get();
          const normalizedExercises = normalizeData(exercises);
          const mergedExercises = mergeNormalizedData(state.exercises.getState(), normalizedExercises);
          state.exercises = new EntityManager<ExerciseEntity>(mergedExercises);

          set({
            exercises: state.exercises,
            lastUpdated: { ...state.lastUpdated, exercises: new Date().toISOString() },
          }, false, 'setExercises');
        },

        addExercise: (exercise: ExerciseEntity) => {
          const state = get();
          state.exercises.addEntity(exercise);
          set({
            exercises: state.exercises,
            lastUpdated: { ...state.lastUpdated, exercises: new Date().toISOString() },
          }, false, 'addExercise');
        },

        updateExercise: (id: number, updates: Partial<ExerciseEntity>) => {
          const state = get();
          state.exercises.updateEntity(id, updates);
          set({
            exercises: state.exercises,
            lastUpdated: { ...state.lastUpdated, exercises: new Date().toISOString() },
          }, false, 'updateExercise');
        },

        removeExercise: (id: number) => {
          const state = get();
          state.exercises.removeEntity(id);
          set({
            exercises: state.exercises,
            lastUpdated: { ...state.lastUpdated, exercises: new Date().toISOString() },
          }, false, 'removeExercise');
        },

        setExercisesLoading: (loading: boolean) => {
          set(state => ({
            loading: { ...state.loading, exercises: loading },
          }), false, 'setExercisesLoading');
        },

        setExercisesError: (error: string | null) => {
          set(state => ({
            errors: { ...state.errors, exercises: error },
          }), false, 'setExercisesError');
        },

        // Category actions
        setCategories: (categories: CategoryEntity[]) => {
          const state = get();
          const normalizedCategories = normalizeData(categories);
          const mergedCategories = mergeNormalizedData(state.categories.getState(), normalizedCategories);
          state.categories = new EntityManager<CategoryEntity>(mergedCategories);

          set({
            categories: state.categories,
            lastUpdated: { ...state.lastUpdated, categories: new Date().toISOString() },
          }, false, 'setCategories');
        },

        addCategory: (category: CategoryEntity) => {
          const state = get();
          state.categories.addEntity(category);
          set({
            categories: state.categories,
            lastUpdated: { ...state.lastUpdated, categories: new Date().toISOString() },
          }, false, 'addCategory');
        },

        updateCategory: (id: string, updates: Partial<CategoryEntity>) => {
          const state = get();
          state.categories.updateEntity(id, updates);
          set({
            categories: state.categories,
            lastUpdated: { ...state.lastUpdated, categories: new Date().toISOString() },
          }, false, 'updateCategory');
        },

        removeCategory: (id: string) => {
          const state = get();
          state.categories.removeEntity(id);
          set({
            categories: state.categories,
            lastUpdated: { ...state.lastUpdated, categories: new Date().toISOString() },
          }, false, 'removeCategory');
        },

        setCategoriesLoading: (loading: boolean) => {
          set(state => ({
            loading: { ...state.loading, categories: loading },
          }), false, 'setCategoriesLoading');
        },

        setCategoriesError: (error: string | null) => {
          set(state => ({
            errors: { ...state.errors, categories: error },
          }), false, 'setCategoriesError');
        },

        // Utility actions
        clearAll: () => {
          set(initialState, false, 'clearAll');
        },

        resetErrors: () => {
          set(state => ({
            errors: {
              routines: null,
              workouts: null,
              meals: null,
              exercises: null,
              categories: null,
            },
          }), false, 'resetErrors');
        },
      }),
      {
        name: 'normalized-store-persist',
        partialize: (state) => ({
          routines: state.routines.getState(),
          workouts: state.workouts.getState(),
          meals: state.meals.getState(),
          exercises: state.exercises.getState(),
          categories: state.categories.getState(),
          lastUpdated: state.lastUpdated,
        }),
      }
    ),
    {
      name: 'normalized-store',
    }
  )
);

// Selector hooks for better performance
export const useRoutines = () => useNormalizedStore(state => state.routines.getAllEntities(), shallow);
export const useRoutine = (id: number) => useNormalizedStore(state => state.routines.getEntity(id));
export const useActiveRoutines = () => useNormalizedStore(state => state.routines.getActiveRoutines(), shallow);
export const useUserRoutines = (userId: number) => useNormalizedStore(state => state.routines.getUserRoutines(userId), shallow);
export const useTemplateRoutines = () => useNormalizedStore(state => state.routines.getTemplateRoutines(), shallow);

export const useWorkouts = () => useNormalizedStore(state => state.workouts.getAllEntities(), shallow);
export const useWorkout = (id: number) => useNormalizedStore(state => state.workouts.getEntity(id));
export const useRecentWorkouts = (limit: number = 10) => useNormalizedStore(state => state.workouts.getRecentWorkouts(limit), shallow);
export const useWorkoutsByUser = (userId: number) => useNormalizedStore(state => state.workouts.getWorkoutsByUser(userId), shallow);

export const useMeals = () => useNormalizedStore(state => state.meals.getAllEntities(), shallow);
export const useMeal = (id: number) => useNormalizedStore(state => state.meals.getEntity(id));
export const useRecentMeals = (limit: number = 10) => useNormalizedStore(state => state.meals.getRecentMeals(limit), shallow);
export const useMealsByUser = (userId: number) => useNormalizedStore(state => state.meals.getMealsByUser(userId), shallow);

export const useExercises = () => useNormalizedStore(state => state.exercises.getAllEntities(), shallow);
export const useExercise = (id: number) => useNormalizedStore(state => state.exercises.getEntity(id));

export const useCategories = () => useNormalizedStore(state => state.categories.getAllEntities(), shallow);
export const useCategory = (id: string) => useNormalizedStore(state => state.categories.getEntity(id));

// Loading and error selectors
export const useRoutinesLoading = () => useNormalizedStore(state => state.loading.routines);
export const useRoutinesError = () => useNormalizedStore(state => state.errors.routines);
export const useWorkoutsLoading = () => useNormalizedStore(state => state.loading.workouts);
export const useWorkoutsError = () => useNormalizedStore(state => state.errors.workouts);
export const useMealsLoading = () => useNormalizedStore(state => state.loading.meals);
export const useMealsError = () => useNormalizedStore(state => state.errors.meals);
export const useExercisesLoading = () => useNormalizedStore(state => state.loading.exercises);
export const useExercisesError = () => useNormalizedStore(state => state.errors.exercises);
export const useCategoriesLoading = () => useNormalizedStore(state => state.loading.categories);
export const useCategoriesError = () => useNormalizedStore(state => state.errors.categories);

export default useNormalizedStore;
