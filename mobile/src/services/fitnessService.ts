import { api } from './api';

import { BaseService } from './BaseService';
import { getTodayLocal } from '../utils/dateUtils';

import { DebugUtils } from '../utils/debugUtils';

export interface FitnessLog {
  id: number;
  user_id: number;
  activity_type: string;
  activity_name?: string;
  duration_minutes: number;
  intensity?: string;
  calories_burned?: number;
  distance_km?: number;
  weight_kg?: number;
  reps?: number;
  sets?: number;
  notes?: string;
  location?: string;
  weather?: string;
  activity_date: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSummary {
  workouts: number;
  total_duration: number;
  calories_burned: number;
  avg_intensity: string;
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalDuration: number;
  totalCalories: number;
  averageDuration: number;
  averageCalories: number;
  workouts: FitnessLog[];
}

export interface ExerciseType {
  id: number;
  name: string;
  category: string;
  muscle_group: string;
  equipment?: string;
  instructions?: string;
  difficulty: string;
  logging_category: string;
  logging_category_info?: {
    id: string;
    name: string;
    display_name: string;
    color?: string;
    icon?: string;
  };
}

export interface WorkoutCategory {
  id: number;
  name: string;
  category: string;
  display_name: string;
  description?: string;
  icon?: string;
  color?: string;
  logging_attributes?: Record<string, unknown>;
}

export interface ExerciseData {
  exercise_name: string;
  sets?: number | string;
  reps?: string | number;
  weight_used?: number | string;
  weight?: number | string; // Alternative field name
  weight_unit?: string;
  duration?: number | string; // in minutes
  distance?: number | string; // in km/miles
  distance_unit?: string;
  intensity?: string; // low, medium, high
  category?: string; // bodyweight, weighted, cardio_duration, distance_based
  logging_category?: string; // Alternative field name
  notes?: string;
}

export interface LatestExerciseData {
  exercise_name: string;
  sets?: number;
  reps?: string;
  weight_kg?: number;
  weight_used?: number;
  duration_minutes?: number;
  distance?: number;
  rest_time?: number;
  notes?: string;
  workout_date?: string;
}

class FitnessService extends BaseService {
  private pendingRequests = new Set<string>();

  async getFitnessLogs(params?: {
    period?: string;
    page?: number;
    size?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<FitnessLog[]> {
    // Convert string dates to datetime objects for the API
    const apiParams = this.getPaginationParams(params);

    return this.makeRequest(
      () => api.get('/api/v1/health/logging/fitness', { params: apiParams }),
      'FITNESS SERVICE - getFitnessLogs'
    );
  }

  async getRecentWorkouts(limit: number = 5): Promise<FitnessLog[]> {
    return this.makeRequest(
      () => api.get('/api/v1/health/logging/fitness', {
        params: { size: limit, page: 1 }
      }),
      'FITNESS SERVICE - getRecentWorkouts'
    );
  }

  async getTodayWorkoutSummary(): Promise<WorkoutSummary> {
    try {
      // Use user's timezone for today's date calculation
      const today = new Date().toLocaleDateString("en-CA", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      const logs = await this.getFitnessLogs({
        start_date: today,
        end_date: today
      });

      const summary: WorkoutSummary = {
        workouts: logs.length,
        total_duration: logs.reduce((sum: number, log: FitnessLog) => sum + (log.duration_minutes || 0), 0),
        calories_burned: logs.reduce((sum: number, log: FitnessLog) => sum + (log.calories_burned || 0), 0),
        avg_intensity: logs.length > 0 ? logs[0].intensity || 'medium' : 'medium'
      };

      return summary;
    } catch (error) {
      this.handleError(error, 'FITNESS SERVICE - getTodayWorkoutSummary');
      return {
        workouts: 0,
        total_duration: 0,
        calories_burned: 0,
        avg_intensity: 'medium'
      };
    }
  }

  async logWorkout(workoutData: {
    activity_type: string;
    activity_name?: string;
    duration_minutes: number;
    intensity?: string;
    calories_burned?: number;
    distance_km?: number;
    weight_kg?: number;
    reps?: number;
    sets?: number;
    notes?: string;
    location?: string;
    weather?: string;
    activity_date?: string;
    exercises?: string; // JSON string containing exercise data
    unit?: string; // Unit for weight measurements
  }): Promise<FitnessLog> {
    // Create a unique key for this workout to prevent duplicates
    const workoutKey = `${workoutData.activity_type}_${workoutData.activity_name}_${workoutData.duration_minutes}_${workoutData.exercises}`;

    // Check if this exact workout is already being processed
    if (this.pendingRequests.has(workoutKey)) {
      DebugUtils.log('🚫 [FITNESS SERVICE] Duplicate workout request blocked:', workoutKey);
      throw new Error('Workout is already being processed. Please wait.');
    }

    // Add to pending requests
    this.pendingRequests.add(workoutKey);

    try {
      // Add timezone information to the request
      const timezoneOffset = new Date().getTimezoneOffset() * -1; // Convert to positive offset
      const workoutDataWithTimezone = {
        ...workoutData,
        timezone_offset: timezoneOffset
      };

      DebugUtils.log('🔍 [FITNESS SERVICE] Logging workout with data:', JSON.stringify(workoutDataWithTimezone, null, 2));
      const result = await this.makeRequest(
        () => api.post('/api/v1/health/logging/fitness', workoutDataWithTimezone),
        'FITNESS SERVICE - logWorkout'
      );
      return result;
    } finally {
      // Remove from pending requests after completion
      this.pendingRequests.delete(workoutKey);
    }
  }

  async updateWorkout(id: number, workoutData: Partial<FitnessLog>): Promise<FitnessLog> {
    return this.makeRequest(
      () => api.put(`/health/logging/fitness/${id}`, workoutData),
      'FITNESS SERVICE - updateWorkout'
    );
  }

  async deleteWorkout(id: number): Promise<void> {
    return this.makeRequest(
      () => api.delete(`/health/logging/fitness/${id}`),
      'FITNESS SERVICE - deleteWorkout'
    );
  }

  async getExerciseTypes(): Promise<ExerciseType[]> {
    const data = await this.makeRequest(
      () => api.get('/api/v1/health/exercises/all?limit=1000'),
      'FITNESS SERVICE - getExerciseTypes'
    );
    return data.exercises || data;
  }

  async getExercises(): Promise<ExerciseType[]> {
    // Alias for getExerciseTypes for backward compatibility
    return this.getExerciseTypes();
  }

  async getWorkoutStats(period: string): Promise<WorkoutStats> {
    // Get workout statistics for a given period using the correct endpoint
    const data = await this.makeRequest(
      () => api.get('/api/v1/health/logging/fitness', {
        params: { period: period, size: 50 }
      }),
      'FITNESS SERVICE - getWorkoutStats'
    );
    return data;
  }

  async getRoutines(): Promise<unknown[]> {
    // Get user's fitness routines
    const data = await this.makeRequest(
      () => api.get('/api/v1/health/simple-routines'),
      'FITNESS SERVICE - getRoutines'
    );
    return data.routines || data || [];
  }

  async getFitnessStats(period: string = 'week'): Promise<WorkoutStats> {
    // Get fitness statistics using the correct endpoint
    const data = await this.makeRequest(
      () => api.get('/api/v1/health/logging/fitness', {
        params: { period: period, size: 50 }
      }),
      'FITNESS SERVICE - getFitnessStats'
    );
    return data;
  }

  async getWorkoutCategories(): Promise<WorkoutCategory[]> {
    return this.makeRequest(
      () => api.get('/api/v1/health/exercises/categories'),
      'FITNESS SERVICE - getWorkoutCategories'
    );
  }

  async searchExercises(query: string): Promise<ExerciseType[]> {
    const response = await this.makeRequest(
      () => api.get('/api/v1/health/exercises/search', {
        params: { q: query }
      }),
      'FITNESS SERVICE - searchExercises'
    );

    // The API returns { exercises: [...] }, extract the exercises array
    return response.exercises || [];
  }

  async getLatestExerciseData(exerciseName: string): Promise<LatestExerciseData | null> {
    try {
      const response = await this.makeRequest(
        () => api.get('/api/v1/health/fitness-logs/latest-exercise', {
          params: { exercise_name: exerciseName }
        }),
        'FITNESS SERVICE - getLatestExerciseData'
      );

      // Check if response contains exercise data or just a message
      if (response.message) {
        DebugUtils.log(`🔍 [FITNESS SERVICE] No previous data for exercise: ${exerciseName}`);
        return null;
      }

      DebugUtils.log(`✅ [FITNESS SERVICE] Found previous data for exercise: ${exerciseName}`, response);
      return response;
    } catch (error) {
      DebugUtils.error(`FITNESS SERVICE - getLatestExerciseData for ${exerciseName}:`, error);
      return null;
    }
  }

  async isExerciseLoggedToday(exerciseName: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(
        () => api.get('/api/v1/health/fitness-logs/exercise-logged-today', {
          params: { exercise_name: exerciseName }
        }),
        'FITNESS SERVICE - isExerciseLoggedToday'
      );

      DebugUtils.log(`🔍 [FITNESS SERVICE] Exercise ${exerciseName} logged today:`, response.logged_today);
      return response.logged_today || false;
    } catch (error) {
      DebugUtils.error(`FITNESS SERVICE - isExerciseLoggedToday for ${exerciseName}:`, error);
      return false;
    }
  }

  // Mood logging method
  async logMood(moodData: {
    mood_rating: number;
    energy_level?: number;
    activities?: string[];
    notes?: string;
  }): Promise<unknown> {
    return this.makeRequest(
      () => api.post('/health/logging/mood', {
        ...moodData,
        log_date: getTodayLocal()
      }),
      'FITNESS SERVICE - logMood'
    );
  }
}

// Export singleton instance to maintain backward compatibility
export const fitnessService = new FitnessService();