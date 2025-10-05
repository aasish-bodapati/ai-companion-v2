import { apiClient } from './api';
import { BaseService } from './BaseService';

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
  logging_attributes?: any;
}

export interface LatestExerciseData {
  exercise_name: string;
  sets?: number;
  reps?: string;
  weight_kg?: number;
  duration_minutes?: number;
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
      () => apiClient.get('/health/logging/fitness', { params: apiParams }),
      'FITNESS SERVICE - getFitnessLogs'
    );
  }

  async getRecentWorkouts(limit: number = 5): Promise<FitnessLog[]> {
    return this.makeRequest(
      () => apiClient.get('/health/logging/fitness', {
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
      console.log('🚫 [FITNESS SERVICE] Duplicate workout request blocked:', workoutKey);
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
      
      console.log('🔍 [FITNESS SERVICE] Logging workout with data:', JSON.stringify(workoutDataWithTimezone, null, 2));
      const result = await this.makeRequest(
        () => apiClient.post('/health/logging/fitness', workoutDataWithTimezone),
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
      () => apiClient.put(`/health/logging/fitness/${id}`, workoutData),
      'FITNESS SERVICE - updateWorkout'
    );
  }

  async deleteWorkout(id: number): Promise<void> {
    return this.makeRequest(
      () => apiClient.delete(`/health/logging/fitness/${id}`),
      'FITNESS SERVICE - deleteWorkout'
    );
  }

  async getExerciseTypes(): Promise<ExerciseType[]> {
    const data = await this.makeRequest(
      () => apiClient.get('/health/exercises/all?limit=1000'),
      'FITNESS SERVICE - getExerciseTypes'
    );
    return data.exercises || data;
  }

  async getWorkoutCategories(): Promise<WorkoutCategory[]> {
    return this.makeRequest(
      () => apiClient.get('/health/exercises/categories'),
      'FITNESS SERVICE - getWorkoutCategories'
    );
  }

  async searchExercises(query: string): Promise<ExerciseType[]> {
    const response = await this.makeRequest(
      () => apiClient.get('/health/exercises/search', {
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
        () => apiClient.get('/health/fitness-logs/latest-exercise', {
          params: { exercise_name: exerciseName }
        }),
        'FITNESS SERVICE - getLatestExerciseData'
      );
      
      // Check if response contains exercise data or just a message
      if (response.message) {
        console.log(`🔍 [FITNESS SERVICE] No previous data for exercise: ${exerciseName}`);
        return null;
      }
      
      console.log(`✅ [FITNESS SERVICE] Found previous data for exercise: ${exerciseName}`, response);
      return response;
    } catch (error) {
      console.log(`🔍 [FITNESS SERVICE] Error fetching latest exercise data for ${exerciseName}:`, error);
      return null;
    }
  }

  async isExerciseLoggedToday(exerciseName: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(
        () => apiClient.get('/health/fitness-logs/exercise-logged-today', {
          params: { exercise_name: exerciseName }
        }),
        'FITNESS SERVICE - isExerciseLoggedToday'
      );
      
      console.log(`🔍 [FITNESS SERVICE] Exercise ${exerciseName} logged today:`, response.logged_today);
      return response.logged_today || false;
    } catch (error) {
      console.log(`🔍 [FITNESS SERVICE] Error checking if exercise was logged today:`, error);
      return false;
    }
  }
}

// Export singleton instance to maintain backward compatibility
export const fitnessService = new FitnessService();