/**
 * Utility functions for fitness logs
 */

/**
 * Get difficulty color class based on rating
 */
export function getDifficultyColor(rating: number): string {
  if (rating <= 3) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (rating <= 6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
}

/**
 * Get difficulty text based on rating
 */
export function getDifficultyText(rating: number): string {
  if (rating <= 3) return 'Easy';
  if (rating <= 6) return 'Medium';
  return 'Hard';
}

/**
 * Format duration in minutes to human readable format
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Calculate total duration from logs
 */
export function calculateTotalDuration(logs: Array<{ duration_minutes?: number }>): number {
  return logs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
}

/**
 * Calculate total calories from logs
 */
export function calculateTotalCalories(logs: Array<{ calories_burned?: number }>): number {
  return logs.reduce((sum, log) => sum + (log.calories_burned || 0), 0);
}

/**
 * Calculate average difficulty from logs
 */
export function calculateAverageDifficulty(logs: Array<{ difficulty_rating?: number }>): number {
  const validRatings = logs.filter(log => log.difficulty_rating !== undefined && log.difficulty_rating > 0);
  if (validRatings.length === 0) return 0;
  
  const total = validRatings.reduce((sum, log) => sum + (log.difficulty_rating || 0), 0);
  return Math.round(total / validRatings.length * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate current streak from logs
 */
export function calculateCurrentStreak(logs: Array<{ activity_date?: string; logged_at?: string; created_at: string }>): number {
  if (logs.length === 0) return 0;
  
  // Sort logs by date (most recent first)
  const sortedLogs = logs
    .map(log => {
      const dateStr = log.activity_date || log.logged_at || log.created_at;
      return {
        ...log,
        date: new Date(dateStr)
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sortedLogs.length; i++) {
    const logDate = new Date(sortedLogs[i].date);
    logDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    
    if (logDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Get workout name display text
 */
export function getWorkoutDisplayName(log: { workout_name?: string; routine_name?: string }): string {
  return log.workout_name || log.routine_name || 'Custom Workout';
}

/**
 * Check if a log has exercise details
 */
export function hasExerciseDetails(log: { exercises?: Array<any> }): boolean {
  return !!(log.exercises && log.exercises.length > 0);
}

/**
 * Get exercise count text
 */
export function getExerciseCountText(count: number): string {
  return `${count} exercise${count !== 1 ? 's' : ''}`;
}

/**
 * Format exercise details for display
 */
export function formatExerciseDetails(exercise: {
  exercise_name: string;
  sets: number;
  reps: string;
  weight_used?: number;
}, log: { unit?: string }): string {
  const weightText = exercise.weight_used ? ` @ ${exercise.weight_used}${log.unit || 'kg'}` : '';
  return `${exercise.exercise_name}: ${exercise.sets}×${exercise.reps}${weightText}`;
}

/**
 * Get workout summary stats
 */
export function getWorkoutSummaryStats(log: {
  exercises?: Array<any>;
  duration_minutes?: number;
  calories_burned?: number;
}) {
  return {
    exerciseCount: log.exercises?.length || 0,
    duration: log.duration_minutes || 0,
    calories: log.calories_burned || 0,
    hasDetails: hasExerciseDetails(log)
  };
}

/**
 * Validate workout log data
 */
export function validateWorkoutLogData(data: {
  activity_name: string;
  duration_minutes: number;
  calories_burned: number;
  notes: string;
  activity_type: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.activity_name.trim()) {
    errors.push('Activity name is required');
  }
  
  if (data.duration_minutes < 0) {
    errors.push('Duration must be positive');
  }
  
  if (data.calories_burned < 0) {
    errors.push('Calories burned must be positive');
  }
  
  if (!data.activity_type.trim()) {
    errors.push('Activity type is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
