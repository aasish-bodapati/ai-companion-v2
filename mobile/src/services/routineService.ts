import { apiClient } from './api';

export interface SimpleRoutine {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks: number;
  created_by_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutDay {
  day: string;
  workouts: Workout[];
  exercises?: any[]; // For backward compatibility
}

export interface Workout {
  activity_name: string;
  activity_type: string;
  sets?: number;
  reps?: string;
  duration?: number;
  distance?: number;
  distance_unit?: string;
  intensity?: string;
  heart_rate?: number;
  difficulty?: string;
  total_reps?: number;
  time?: number;
  pace?: string;
  weight_notes?: string;
  rest_time?: string;
  notes?: string;
}

export interface SimpleRoutineWithProgress extends SimpleRoutine {
  workout_schedule: WorkoutDay[];
  total_workouts_per_week: number;
  is_template?: boolean;
  user_progress?: {
    is_active: boolean;
    workouts_completed: number;
    last_workout_date?: string;
    started_at?: string;
  };
}

export interface RoutineResponse {
  routines: SimpleRoutineWithProgress[];
  total: number;
  page: number;
  size: number;
}

export interface CreateRoutineData {
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks: number;
  target_calories?: number;
}

export const routineService = {
  // Get user's own routines (private)
  async getRoutines(params?: {
    limit?: number;
    page?: number;
  }): Promise<RoutineResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }

      const response = await apiClient.get(`/health/simple-routines/?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch routines:', error);
      throw error;
    }
  },

  // Get a specific routine by ID
  async getRoutine(routineId: string): Promise<SimpleRoutineWithProgress> {
    try {
      const response = await apiClient.get(`/health/simple-routines/${routineId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch routine:', error);
      throw error;
    }
  },

  // Create a new routine
  async createRoutine(routineData: CreateRoutineData): Promise<SimpleRoutineWithProgress> {
    try {
      const response = await apiClient.post('/health/simple-routines/', routineData);
      return response.data;
    } catch (error) {
      console.error('Failed to create routine:', error);
      throw error;
    }
  },

  // Create routine with workout plan
  async createRoutineWithWorkoutPlan(
    routineData: CreateRoutineData,
    workoutDays: WorkoutDay[]
  ): Promise<SimpleRoutineWithProgress> {
    try {
      const response = await apiClient.post('/health/simple-routines/with-workout-plan', {
        routine_data: routineData,
        workout_days: workoutDays,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create routine with workout plan:', error);
      throw error;
    }
  },

  // Update a routine
  async updateRoutine(
    routineId: string,
    routineData: Partial<CreateRoutineData>
  ): Promise<SimpleRoutineWithProgress> {
    try {
      const response = await apiClient.put(`/health/simple-routines/${routineId}/`, routineData);
      return response.data;
    } catch (error) {
      console.error('Failed to update routine:', error);
      throw error;
    }
  },

  // Update routine with workout plan
  async updateRoutineWithWorkoutPlan(
    routineId: string,
    routineData: CreateRoutineData,
    workoutDays: WorkoutDay[]
  ): Promise<SimpleRoutineWithProgress> {
    try {
      const response = await apiClient.put(`/health/simple-routines/${routineId}/with-workout-plan`, {
        routine_data: routineData,
        workout_days: workoutDays,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update routine with workout plan:', error);
      throw error;
    }
  },

  // Delete a routine
  async deleteRoutine(routineId: string): Promise<void> {
    try {
      await apiClient.delete(`/health/simple-routines/${routineId}`);
    } catch (error) {
      console.error('Failed to delete routine:', error);
      throw error;
    }
  },

  // Start a routine (set as active)
  async startRoutine(routineId: string): Promise<void> {
    try {
      await apiClient.post(`/health/simple-routines/${routineId}/start`);
    } catch (error) {
      console.error('Failed to start routine:', error);
      throw error;
    }
  },

  // Stop a routine (set as inactive)
  async stopRoutine(routineId: string): Promise<void> {
    try {
      await apiClient.post(`/health/simple-routines/${routineId}/stop`);
    } catch (error) {
      console.error('Failed to stop routine:', error);
      throw error;
    }
  },

  // Get routine progress
  async getRoutineProgress(routineId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/health/simple-routines/${routineId}/progress`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch routine progress:', error);
      throw error;
    }
  },

  // Get today's workout from active routine
  async getTodaysWorkout(): Promise<any> {
    try {
      const response = await apiClient.get('/health/simple-routines/active/previous-week-workout');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch today\'s workout:', error);
      throw error;
    }
  },

  // Log today's workout
  async logTodaysWorkout(routineId: string): Promise<void> {
    try {
      await apiClient.post(`/health/simple-routines/${routineId}/log-workout`);
    } catch (error) {
      console.error('Failed to log today\'s workout:', error);
      throw error;
    }
  },

  // Skip today's workout
  async skipTodaysWorkout(routineId: string): Promise<void> {
    try {
      await apiClient.post(`/health/simple-routines/${routineId}/skip-workout`);
    } catch (error) {
      console.error('Failed to skip today\'s workout:', error);
      throw error;
    }
  },

  // Get workout logs
  async getWorkoutLogs(params?: {
    period?: 'week' | 'month' | 'all';
    page?: number;
    size?: number;
  }): Promise<{
    logs: any[];
    stats: any;
    pagination: any;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.period) {
        queryParams.append('period', params.period);
      }
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.size) {
        queryParams.append('size', params.size.toString());
      }

      const response = await apiClient.get(`/health/simple-routines/workout-logs?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch workout logs:', error);
      throw error;
    }
  },

  // Create workout log with exercise data
  async createWorkoutLog(logData: {
    activity_name: string;
    activity_type: string;
    duration_minutes: number;
    calories_burned: number;
    notes?: string;
    exercises: string; // JSON string
    unit?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.post('/health/fitness-logs/', logData);
      return response.data;
    } catch (error) {
      console.error('Failed to create workout log:', error);
      throw error;
    }
  },

  // Update workout log
  async updateWorkoutLog(logId: string, updateData: {
    notes?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.put(`/health/fitness-logs/${logId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Failed to update workout log:', error);
      throw error;
    }
  },

  // Update workout log exercises
  async updateWorkoutLogExercises(logId: string, exercises: any[]): Promise<any> {
    try {
      const response = await apiClient.put(`/health/fitness-logs/${logId}`, {
        exercises: JSON.stringify(exercises)
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update workout log exercises:', error);
      throw error;
    }
  },

  // Delete workout log
  async deleteWorkoutLog(logId: string): Promise<void> {
    try {
      await apiClient.delete(`/health/fitness-logs/${logId}`);
    } catch (error) {
      console.error('Failed to delete workout log:', error);
      throw error;
    }
  },
};
