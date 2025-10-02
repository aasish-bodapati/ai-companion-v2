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
      const today = new Date().toISOString().split('T')[0];
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
    return this.makeRequest(
      () => apiClient.get('/health/exercises/all?limit=1000'),
      'FITNESS SERVICE - getExerciseTypes'
    ).then(data => data.exercises || data);
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

  async getLatestWorkoutForExercise(exerciseName: string): Promise<any> {
    try {
      const response = await this.makeRequest(
        () => apiClient.get('/health/fitness-logs/latest-exercise', {
          params: { exercise_name: exerciseName }
        }),
        'FITNESS SERVICE - getLatestWorkoutForExercise'
      );
      return response;
    } catch (error) {
      console.error('Error fetching latest workout for exercise:', error);
      return null;
    }
  }
}

// Export singleton instance to maintain backward compatibility
export const fitnessService = new FitnessService();