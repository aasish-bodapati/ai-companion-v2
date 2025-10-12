/**
 * Zustand store types and interfaces
 * Centralized type definitions for all store slices
 */

import { User } from '../contexts/AuthContext';


// Base achievement interface
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  progress?: number;
  unlockedAt?: string;
  category: 'fitness' | 'nutrition' | 'consistency' | 'milestone';
}

// Streak interface
export interface Streak {
  type: 'workout' | 'nutrition' | 'water' | 'mood';
  current: number;
  best: number;
  icon: string;
  color: string;
  label: string;
  unit: string;
}

// Progress metrics interface
export interface ProgressMetrics {
  workouts: { current: number; target: number; progress: number };
  calories: { current: number; target: number; progress: number };
  protein: { current: number; target: number; progress: number };
  water: { current: number; target: number; progress: number };
  steps: { current: number; target: number; progress: number };
  mood: { current: number; target: number; progress: number };
}

// Nutrition-specific types
export interface NutritionStats {
  total_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  meals_count: number;
  avg_calories_per_meal: number;
  total_meals: number;
  average_daily_calories: number;
  macro_breakdown: {
    protein: number;
    carbs: number;
    fat: number;
  };
  streak: number;
  weekly_goal_progress: number;
}

export interface MealLog {
  id?: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_items: {
    food_item: Record<string, unknown>;
    quantity: number;
    unit: string;
  }[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  logged_at: string;
}

// Fitness-specific types
export interface WorkoutStats {
  totalWorkouts: number;
  totalDuration: number;
  totalCalories: number;
  averageDuration: number;
  averageCalories: number;
  workouts: Record<string, unknown>[];
}

export interface WorkoutLog {
  id?: string;
  activity_type: string;
  duration_minutes: number;
  calories_burned: number;
  notes?: string;
  activity_date: string;
  routine_id?: string;
}

// Store state interfaces
export interface AppState {
  // User data
  user: User | null;

  // Global state
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;

  // Progress metrics
  progressMetrics: ProgressMetrics;

  // Achievements and streaks
  achievements: Achievement[];
  streaks: Streak[];

  // AI insights
}

export interface NutritionState {
  // Nutrition data
  todayStats: NutritionStats | null;
  weekStats: NutritionStats | null;
  recentMeals: MealLog[];

  // UI state
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface FitnessState {
  // Fitness data
  todayStats: WorkoutStats | null;
  weekStats: WorkoutStats | null;
  recentWorkouts: WorkoutLog[];

  // UI state
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// Store actions interfaces
export interface AppActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProgressMetrics: (metrics: ProgressMetrics) => void;
  setAchievements: (achievements: Achievement[]) => void;
  setStreaks: (streaks: Streak[]) => void;
  updateAchievement: (id: string, unlocked: boolean, progress?: number) => void;
  updateStreak: (type: string, current: number) => void;
  refreshData: () => Promise<void>;
  resetState: () => void;
}

export interface NutritionActions {
  setTodayStats: (stats: NutritionStats | null) => void;
  setWeekStats: (stats: NutritionStats | null) => void;
  setRecentMeals: (meals: MealLog[]) => void;
  addMeal: (meal: MealLog) => void;
  updateMeal: (id: string, meal: Partial<MealLog>) => void;
  deleteMeal: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshNutritionData: () => Promise<void>;
  resetNutritionState: () => void;
}

export interface FitnessActions {
  setTodayStats: (stats: WorkoutStats | null) => void;
  setWeekStats: (stats: WorkoutStats | null) => void;
  setRecentWorkouts: (workouts: WorkoutLog[]) => void;
  addWorkout: (workout: WorkoutLog) => void;
  updateWorkout: (id: string, workout: Partial<WorkoutLog>) => void;
  deleteWorkout: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshFitnessData: () => Promise<void>;
  resetFitnessState: () => void;
}

// Water-specific types
export interface WaterLog {
  id: number;
  user_id: number;
  amount_ml: number;
  amount_oz: number;
  log_type: 'manual' | 'goal' | 'reminder';
  notes?: string;
  log_date: string;
  created_at: string;
  updated_at: string;
}

export interface WaterLogStats {
  total_ml_today: number;
  total_oz_today: number;
  goal_ml: number;
  goal_oz: number;
  progress_percentage: number;
  logs_today: number;
  average_per_log: number;
}

// Combined store types
export type AppStore = AppState & AppActions;

// Exercise Categories types
export interface ExerciseCategory {
  id: string;
  name: string;
  display_name: string;
  color: string;
  icon: string;
}

export interface ExerciseCategoriesState {
  categories: ExerciseCategory[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  loaded: boolean;
}

export interface ExerciseCategoriesActions {
  setCategories: (categories: ExerciseCategory[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLoaded: (loaded: boolean) => void;
  loadCategories: () => Promise<ExerciseCategory[]>;
  getCategoryById: (id: string) => ExerciseCategory | null;
  getCategoryConfig: (categoryId: string) => ExerciseCategory;
  categoryExists: (categoryId: string) => boolean;
  getCategoriesByIds: (ids: string[]) => ExerciseCategory[];
  searchCategories: (query: string) => ExerciseCategory[];
  getAllCategoryIds: () => string[];
  getCategoriesGrouped: () => {
    all: ExerciseCategory[];
    byType: {
      bodyweight: ExerciseCategory[];
      weighted: ExerciseCategory[];
      cardio: ExerciseCategory[];
      distance: ExerciseCategory[];
    };
  };
  refreshCategories: () => Promise<ExerciseCategory[]>;
  resetExerciseCategoriesState: () => void;
}

export type ExerciseCategoriesStore = ExerciseCategoriesState & ExerciseCategoriesActions;
export type NutritionStore = NutritionState & NutritionActions;
export type FitnessStore = FitnessState & FitnessActions;
