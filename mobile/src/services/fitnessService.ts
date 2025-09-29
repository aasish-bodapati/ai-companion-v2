import { apiClient } from './api';

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
  description?: string;
  icon?: string;
}

export const fitnessService = {
  async getFitnessLogs(params?: {
    period?: string;
    page?: number;
    size?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<FitnessLog[]> {
    try {
      const response = await apiClient.get('/health/fitness-logs/', { params });
      
      // Extract logs array from response
      const logs = response.data?.logs || response.data || [];
      
      // Ensure it's an array
      if (!Array.isArray(logs)) {
        console.warn('Fitness Service: Expected array but got:', typeof logs);
        return [];
      }
      
      return logs;
    } catch (error) {
      console.error('Fitness Service: Error fetching logs:', error);
      throw error;
    }
  },

  async getRecentWorkouts(limit: number = 5): Promise<FitnessLog[]> {
    try {
      const response = await apiClient.get('/health/logging/fitness', {
        params: { size: limit, page: 1 }
      });
      
      // Extract logs array from response
      const logs = response.data?.logs || response.data || [];
      
      // Ensure it's an array
      if (!Array.isArray(logs)) {
        console.warn('Fitness Service: Expected array but got:', typeof logs);
        return [];
      }
      
      return logs;
    } catch (error) {
      console.error('Fitness Service: Error fetching recent workouts:', error);
      throw error;
    }
  },

  async getTodayWorkoutSummary(): Promise<WorkoutSummary> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await apiClient.get('/health/logging/fitness', {
        params: { start_date: today, end_date: today }
      });
      
      const logs = response.data || [];
      const summary: WorkoutSummary = {
        workouts: logs.length,
        total_duration: logs.reduce((sum: number, log: FitnessLog) => sum + (log.duration_minutes || 0), 0),
        calories_burned: logs.reduce((sum: number, log: FitnessLog) => sum + (log.calories_burned || 0), 0),
        avg_intensity: logs.length > 0 ? logs[0].intensity || 'medium' : 'medium'
      };
      
      return summary;
    } catch (error) {
      console.error('Fitness Service: Error fetching today\'s summary:', error);
      return {
        workouts: 0,
        total_duration: 0,
        calories_burned: 0,
        avg_intensity: 'medium'
      };
    }
  },

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
  }): Promise<FitnessLog> {
    try {
      console.log('🏃 Fitness Service: Logging workout...', workoutData);
      const response = await apiClient.post('/health/logging/fitness', workoutData);
      console.log('🏃 Fitness Service: Workout logged:', response.data);
      return response.data;
    } catch (error) {
      console.error('🏃 Fitness Service: Error logging workout:', error);
      throw error;
    }
  },

  async updateWorkout(id: number, workoutData: Partial<FitnessLog>): Promise<FitnessLog> {
    try {
      console.log('🏃 Fitness Service: Updating workout...', id, workoutData);
      const response = await apiClient.put(`/health/logging/fitness/${id}`, workoutData);
      console.log('🏃 Fitness Service: Workout updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('🏃 Fitness Service: Error updating workout:', error);
      throw error;
    }
  },

  async deleteWorkout(id: number): Promise<void> {
    try {
      console.log('🏃 Fitness Service: Deleting workout...', id);
      await apiClient.delete(`/health/logging/fitness/${id}`);
      console.log('🏃 Fitness Service: Workout deleted');
    } catch (error) {
      console.error('🏃 Fitness Service: Error deleting workout:', error);
      throw error;
    }
  },

  async getExerciseTypes(): Promise<ExerciseType[]> {
    try {
      console.log('🏃 Fitness Service: Fetching exercise types...');
      const response = await apiClient.get('/health/exercises/types');
      console.log('🏃 Fitness Service: Exercise types received:', response.data);
      return response.data;
    } catch (error) {
      console.error('🏃 Fitness Service: Error fetching exercise types:', error);
      throw error;
    }
  },

  async getWorkoutCategories(): Promise<WorkoutCategory[]> {
    try {
      console.log('🏃 Fitness Service: Fetching workout categories...');
      const response = await apiClient.get('/health/exercises/categories');
      console.log('🏃 Fitness Service: Categories received:', response.data);
      return response.data;
    } catch (error) {
      console.error('🏃 Fitness Service: Error fetching categories:', error);
      throw error;
    }
  },

  async searchExercises(query: string): Promise<ExerciseType[]> {
    try {
      console.log('🏃 Fitness Service: Searching exercises...', query);
      const response = await apiClient.get('/health/exercises/search', {
        params: { q: query }
      });
      console.log('🏃 Fitness Service: Search results:', response.data);
      return response.data;
    } catch (error) {
      console.error('🏃 Fitness Service: Error searching exercises:', error);
      throw error;
    }
  }
};