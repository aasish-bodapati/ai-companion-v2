import { apiClient } from './api';
import { BaseService } from './BaseService';

export interface SimpleRoutine {
  id: number;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks: number;
  created_by_user_id?: number;
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

class RoutineService extends BaseService {
  private pendingRequests = new Set<string>();

  // Get system template routines (public)
  async getTemplates(params?: {
    limit?: number;
    page?: number;
  }): Promise<RoutineResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }

    return this.makeRequest(
      () => apiClient.get(`/health/simple-routines/templates?${queryParams.toString()}`),
      'ROUTINE SERVICE - getTemplates'
    );
  }

  // Get user's own routines (private)
  async getRoutines(params?: {
    limit?: number;
    page?: number;
  }): Promise<RoutineResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }

    return this.makeRequest(
      () => apiClient.get(`/health/simple-routines/?${queryParams.toString()}`),
      'ROUTINE SERVICE - getRoutines'
    );
  }

  // Get a specific routine by ID (user-created only)
  async getRoutine(routineId: number): Promise<SimpleRoutineWithProgress> {
    return this.makeRequest(
      () => apiClient.get(`/health/simple-routines/${routineId}`),
      'ROUTINE SERVICE - getRoutine'
    );
  }

  // Get a specific template routine by ID (public access)
  async getTemplateRoutine(routineId: number): Promise<SimpleRoutineWithProgress> {
    console.log('🔍 Fetching template routine:', routineId);
    return this.makeRequest(
      () => apiClient.get(`/health/simple-routines/templates/${routineId}`),
      'ROUTINE SERVICE - getTemplateRoutine'
    ).then(data => {
      console.log('✅ Template routine fetched successfully:', {
        id: data.id,
        name: data.name,
        isTemplate: data.is_template
      });
      return data;
    });
  }

  // Get the user's currently active routine
  async getActiveRoutine(): Promise<SimpleRoutineWithProgress | null> {
    try {
      console.log('🔍 Fetching active routine...');
      const data = await this.makeRequest(
        () => apiClient.get('/health/simple-routines/active'),
        'ROUTINE SERVICE - getActiveRoutine'
      );
      console.log('✅ Active routine fetched successfully:', {
        id: data.id,
        name: data.name,
        isTemplate: data.is_template,
        isActive: data.user_progress?.is_active
      });
      return data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('ℹ️ No active routine found');
        return null;
      }
      this.handleError(error, 'ROUTINE SERVICE - getActiveRoutine');
      throw error;
    }
  }

  // Create a user copy of a template routine
  async createFromTemplate(templateId: number, customName?: string): Promise<SimpleRoutineWithProgress> {
    try {
      console.log('🔄 Creating routine from template:', { templateId, customName });
      
      // First get the template routine
      const template = await this.getTemplateRoutine(templateId);
      console.log('📋 Template loaded:', {
        name: template.name,
        workoutDays: template.workout_schedule?.length || 0,
        exercises: template.workout_schedule?.reduce((total, day) => total + (day.exercises?.length || 0), 0) || 0
      });
      
      // Create a new routine based on the template
      const routineData: CreateRoutineData = {
        name: customName || `${template.name} (Copy)`,
        description: template.description,
        difficulty: template.difficulty,
        duration_weeks: template.duration_weeks,
      };

      console.log('📝 Creating routine with data:', routineData);

      // Create the routine with workout plan
      const workoutDaysData = template.workout_schedule.map(day => ({
        day: day.day,
        day_order: day.day_order || 0,
        workout_name: day.workout_name,
        description: day.description,
        exercises: day.exercises.map(exercise => ({
          exercise_name: exercise.exercise_name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight_notes: exercise.weight_notes,
          rest_time: exercise.rest_time,
          notes: exercise.notes,
          order_index: exercise.order_index
        }))
      }));

      console.log('🏋️ Workout days data prepared:', {
        daysCount: workoutDaysData.length,
        exercisesCount: workoutDaysData.reduce((total, day) => total + day.exercises.length, 0)
      });

      const data = await this.makeRequest(
        () => apiClient.post('/health/simple-routines/with-workout-plan', {
          routine_data: routineData,
          workout_days: workoutDaysData
        }),
        'ROUTINE SERVICE - createFromTemplate'
      );
      
      console.log('✅ Routine created successfully:', {
        id: data.id,
        name: data.name,
        isTemplate: data.is_template
      });
      
      return data;
    } catch (error) {
      this.handleError(error, 'ROUTINE SERVICE - createFromTemplate');
      throw error;
    }
  }

  // Create a new routine
  async createRoutine(routineData: CreateRoutineData): Promise<SimpleRoutineWithProgress> {
    return this.makeRequest(
      () => apiClient.post('/health/simple-routines/', routineData),
      'ROUTINE SERVICE - createRoutine'
    );
  }

  // Create routine with workout plan
  async createRoutineWithWorkoutPlan(
    routineData: CreateRoutineData,
    workoutDays: WorkoutDay[]
  ): Promise<SimpleRoutineWithProgress> {
    return this.makeRequest(
      () => apiClient.post('/health/simple-routines/with-workout-plan', {
        routine_data: routineData,
        workout_days: workoutDays,
      }),
      'ROUTINE SERVICE - createRoutineWithWorkoutPlan'
    );
  }

  // Update a routine
  async updateRoutine(
    routineId: number,
    routineData: Partial<CreateRoutineData>
  ): Promise<SimpleRoutineWithProgress> {
    return this.makeRequest(
      () => apiClient.put(`/health/simple-routines/${routineId}/`, routineData),
      'ROUTINE SERVICE - updateRoutine'
    );
  }

  // Update routine with workout plan
  async updateRoutineWithWorkoutPlan(
    routineId: number,
    routineData: CreateRoutineData,
    workoutDays: WorkoutDay[]
  ): Promise<SimpleRoutineWithProgress> {
    return this.makeRequest(
      () => apiClient.put(`/health/simple-routines/${routineId}/with-workout-plan`, {
        routine_data: routineData,
        workout_days: workoutDays,
      }),
      'ROUTINE SERVICE - updateRoutineWithWorkoutPlan'
    );
  }

  // Delete a routine
  async deleteRoutine(routineId: number): Promise<void> {
    return this.makeRequest(
      () => apiClient.delete(`/health/simple-routines/${routineId}`),
      'ROUTINE SERVICE - deleteRoutine'
    );
  }

  // Start a routine (set as active)
  async startRoutine(routineId: number): Promise<void> {
    return this.makeRequest(
      () => apiClient.post(`/health/simple-routines/${routineId}/start`),
      'ROUTINE SERVICE - startRoutine'
    );
  }

  // Stop a routine (set as inactive)
  async stopRoutine(routineId: number): Promise<void> {
    return this.makeRequest(
      () => apiClient.post(`/health/simple-routines/${routineId}/stop`),
      'ROUTINE SERVICE - stopRoutine'
    );
  }

  // Get routine progress
  async getRoutineProgress(routineId: number): Promise<any> {
    return this.makeRequest(
      () => apiClient.get(`/health/simple-routines/${routineId}/progress`),
      'ROUTINE SERVICE - getRoutineProgress'
    );
  }

  // Get today's workout from active routine
  async getTodaysWorkout(): Promise<any> {
    console.log('🔍 Fetching today\'s workout from active routine...');
    try {
      // Use direct API call instead of makeRequest to handle 404s gracefully
      const response = await apiClient.get('/health/simple-routines/active/today-workout');
      const data = this.extractData(response);
      
      console.log('✅ Today\'s workout fetched successfully:', {
        dayName: data?.day_name,
        workoutName: data?.workout_name,
        routineId: data?.routine_id,
        exercisesCount: data?.exercises?.length || 0
      });
      return data;
    } catch (error: any) {
      // Handle 404 error gracefully (no workout scheduled for today)
      if (error.response?.status === 404) {
        console.log('ℹ️ No workout scheduled for today');
        return null; // Return null instead of throwing
      }
      
      // For other errors, log and re-throw
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw error;
    }
  }

  // Log today's workout
  async logTodaysWorkout(routineId: number): Promise<void> {
    return this.makeRequest(
      () => apiClient.post(`/health/simple-routines/${routineId}/log-workout`),
      'ROUTINE SERVICE - logTodaysWorkout'
    );
  }

  // Skip today's workout
  async skipTodaysWorkout(routineId: number): Promise<void> {
    return this.makeRequest(
      () => apiClient.post(`/health/simple-routines/${routineId}/skip-workout`),
      'ROUTINE SERVICE - skipTodaysWorkout'
    );
  }

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

    return this.makeRequest(
      () => apiClient.get(`/health/simple-routines/workout-logs?${queryParams.toString()}`),
      'ROUTINE SERVICE - getWorkoutLogs'
    );
  }

  // Create workout log with exercise data - now uses fitnessService endpoint
  async createWorkoutLog(logData: {
    activity_name: string;
    activity_type: string;
    duration_minutes: number;
    calories_burned: number;
    notes?: string;
    exercises: string; // JSON string
    unit?: string;
  }): Promise<any> {
    // Create a unique key for this workout to prevent duplicates
    const workoutKey = `${logData.activity_type}_${logData.activity_name}_${logData.duration_minutes}_${logData.exercises}`;
    
    // Check if this exact workout is already being processed
    if (this.pendingRequests.has(workoutKey)) {
      console.log('🚫 [ROUTINE SERVICE] Duplicate workout request blocked:', workoutKey);
      throw new Error('Workout is already being processed. Please wait.');
    }

    // Add to pending requests
    this.pendingRequests.add(workoutKey);
    
    try {
      // Add timezone information to the request
      const timezoneOffset = new Date().getTimezoneOffset() * -1; // Convert to positive offset
      const logDataWithTimezone = {
        ...logData,
        timezone_offset: timezoneOffset
      };
      
      console.log('🔍 [ROUTINE SERVICE] Creating workout log with data:', logDataWithTimezone);
      // Use the same endpoint as fitnessService to avoid duplicates
      const result = await this.makeRequest(
        () => apiClient.post('/health/logging/fitness', logDataWithTimezone),
        'ROUTINE SERVICE - createWorkoutLog'
      );
      console.log('✅ [ROUTINE SERVICE] Workout log created successfully:', result);
      return result;
    } finally {
      // Remove from pending requests after completion
      this.pendingRequests.delete(workoutKey);
    }
  }

  // Update workout log - now uses fitnessService endpoint
  async updateWorkoutLog(logId: string, updateData: {
    notes?: string;
  }): Promise<any> {
    return this.makeRequest(
      () => apiClient.put(`/health/logging/fitness/${logId}`, updateData),
      'ROUTINE SERVICE - updateWorkoutLog'
    );
  }

  // Update workout log exercises - now uses fitnessService endpoint
  async updateWorkoutLogExercises(logId: number, exercises: any[]): Promise<any> {
    return this.makeRequest(
      () => apiClient.put(`/health/logging/fitness/${logId}`, {
        exercises: JSON.stringify(exercises)
      }),
      'ROUTINE SERVICE - updateWorkoutLogExercises'
    );
  }

  // Delete workout log - now uses fitnessService endpoint
  async deleteWorkoutLog(logId: number): Promise<void> {
    return this.makeRequest(
      () => apiClient.delete(`/health/logging/fitness/${logId}`),
      'ROUTINE SERVICE - deleteWorkoutLog'
    );
  }
}

// Export singleton instance to maintain backward compatibility
export const routineService = new RoutineService();
