// mobile/src/utils/exerciseCategoryUtils.ts

/**
 * Exercise category mapping utilities
 * Centralized logic for determining exercise categories
 */

export const EXERCISE_CATEGORY_MAPPINGS: Record<string, string> = {
  'run': 'distance_based',
  'running': 'distance_based',
  'jog': 'distance_based',
  'jogging': 'distance_based',
  'walk': 'distance_based',
  'walking': 'distance_based',
  'cycle': 'distance_based',
  'cycling': 'distance_based',
  'bike': 'distance_based',
  'biking': 'distance_based',
  'swim': 'distance_based',
  'swimming': 'distance_based',
  'pushup': 'bodyweight',
  'push-ups': 'bodyweight',
  'push ups': 'bodyweight',
  'situp': 'bodyweight',
  'sit-ups': 'bodyweight',
  'sit ups': 'bodyweight',
  'pullup': 'bodyweight',
  'pull-ups': 'bodyweight',
  'pull ups': 'bodyweight',
  'squat': 'bodyweight',
  'squats': 'bodyweight',
  'plank': 'hold_static',
  'yoga': 'cardio_duration',
  'meditation': 'cardio_duration',
};

export const VALID_CATEGORIES = [
  'bodyweight', 
  'weighted', 
  'cardio_duration', 
  'distance_based', 
  'hold_static', 
  'repetition_only'
];

export interface Exercise {
  exercise_name?: string;
  name?: string;
  exercise_id?: string;
  logging_category?: string;
  category?: string;
}

export interface DatabaseExercise {
  id: string;
  name?: string;
  logging_category?: string;
  category?: string;
}

/**
 * Normalizes exercise name for comparison
 */
export function normalizeExerciseName(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds exercise in database using multiple strategies
 */
export function findExerciseInDatabase(
  exercise: Exercise, 
  exerciseDatabase: DatabaseExercise[]
): DatabaseExercise | null {
  const exerciseName = exercise.exercise_name || exercise.name || 'Exercise Not Found';
  
  // Strategy 1: Find by exercise_id
  if (exercise.exercise_id) {
    const byId = exerciseDatabase.find(ex => ex.id === exercise.exercise_id);
    if (byId) return byId;
  }
  
  // Strategy 2: Exact name match
  const byName = exerciseDatabase.find(ex => 
    ex.name && ex.name.toLowerCase() === exerciseName.toLowerCase()
  );
  if (byName) return byName;
  
  // Strategy 3: Fuzzy matching
  const normalizedSearchName = normalizeExerciseName(exerciseName);
  return exerciseDatabase.find(ex => {
    if (!ex.name) return false;
    
    const normalizedDbName = normalizeExerciseName(ex.name);
    return normalizedDbName.includes(normalizedSearchName) || 
           normalizedSearchName.includes(normalizedDbName);
  }) || null;
}

/**
 * Gets exercise category with fallback logic
 */
export function getExerciseCategory(
  exercise: Exercise, 
  exerciseDatabase: DatabaseExercise[] = []
): string {
  const exerciseName = exercise.exercise_name || exercise.name || 'Exercise Not Found';
  const normalizedName = exerciseName.toLowerCase().trim();
  
  // Check common mappings first
  if (EXERCISE_CATEGORY_MAPPINGS[normalizedName]) {
    return EXERCISE_CATEGORY_MAPPINGS[normalizedName];
  }
  
  // Try to find in database
  const dbExercise = findExerciseInDatabase(exercise, exerciseDatabase);
  if (dbExercise) {
    const category = dbExercise.logging_category || dbExercise.category;
    
    // Validate category
    if (category && VALID_CATEGORIES.includes(category)) {
      return category;
    }
    
    // Default for exercises that exist but don't have valid category info
    return 'weighted';
  }
  
  // Unknown exercise
  return 'unknown';
}
