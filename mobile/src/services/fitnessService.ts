import { apiClient } from './api';

export interface WorkoutLog {
  id: string;
  user_id: number;
  activity_type: string;
  activity_name?: string;
  duration_minutes: number;
  calories_burned?: number;
  exercises?: string; // JSON string
  unit?: string;
  notes?: string;
  activity_date: string;
  created_at: string;
  updated_at: string;
  // Additional properties for display
  routine_name?: string;
  workout_name?: string;
  difficulty_rating?: number;
  logged_at?: string;
  total_duration?: number;
}

export interface ExerciseData {
  exercise_name: string;
  sets: number;
  reps: string;
  weight_used?: number;
  weight_unit?: string;
  duration?: number;
  distance?: number;
  distance_unit?: string;
  notes?: string;
  category?: string;
}

export interface WorkoutStats {
  total_workouts: number;
  total_duration: number;
  total_calories_burned: number;
  average_duration: number;
  average_calories: number;
  most_common_activity: string;
  longest_workout: number;
  this_week_workouts: number;
  this_month_workouts: number;
}

export interface TodayWorkout {
  routine_name: string;
  workout_name: string;
  exercises: {
    exercise_name: string;
    sets: number;
    reps: string;
    weight_used?: number;
    weight_unit?: string;
    duration?: number;
    distance?: number;
    distance_unit?: string;
    notes?: string;
  }[];
  estimated_duration: number;
  difficulty: string;
}

export interface WorkoutFilters {
  activity_type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  size?: number;
}

export const fitnessService = {
  // Get workout logs with filtering
  async getWorkoutLogs(filters: WorkoutFilters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.activity_type) params.append('activity_type', filters.activity_type);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.size) params.append('size', filters.size.toString());

      const response = await apiClient.get(`/health/fitness-logs/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch workout logs:', error);
      throw error;
    }
  },

  // Get today's workout from active routine
  async getTodaysWorkout(): Promise<TodayWorkout> {
    try {
      const response = await apiClient.get('/health/routines/todays-workout');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch today\'s workout:', error);
      throw error;
    }
  },

  // Log a workout
  async logWorkout(workoutData: {
    activity_type: string;
    activity_name?: string;
    duration_minutes: number;
    calories_burned?: number;
    exercises?: ExerciseData[];
    unit?: string;
    notes?: string;
    photos?: string[];
    activity_date?: string;
  }) {
    try {
      // Convert photos to base64 if they exist
      let processedData = { ...workoutData };
      if (workoutData.photos && workoutData.photos.length > 0) {
        // For now, we'll store photo URIs as strings
        // In a real implementation, you'd convert to base64 or upload to a service
        processedData = {
          ...workoutData,
          photos: workoutData.photos, // Keep as URIs for now
        };
      }
      
      // Convert exercises array to JSON string if it's an array
      if (processedData.exercises && Array.isArray(processedData.exercises)) {
        processedData.exercises = JSON.stringify(processedData.exercises);
      }
      
      // Add debugging
      console.log('🔍 DEBUG: Sending workout data:', JSON.stringify(processedData, null, 2));
      console.log('🔍 DEBUG: Data types:', {
        activity_type: typeof processedData.activity_type,
        duration_minutes: typeof processedData.duration_minutes,
        exercises: Array.isArray(processedData.exercises) ? 'array' : typeof processedData.exercises,
        exercises_length: Array.isArray(processedData.exercises) ? processedData.exercises.length : 'N/A'
      });
      
      const response = await apiClient.post('/health/fitness-logs/', processedData);
      console.log('✅ DEBUG: Workout logged successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ DEBUG: Failed to log workout:', error);
      if (error.response) {
        console.error('❌ DEBUG: Error response status:', error.response.status);
        console.error('❌ DEBUG: Error response data:', error.response.data);
        console.error('❌ DEBUG: Error response headers:', error.response.headers);
      }
      throw error;
    }
  },

  // Update workout log
  async updateWorkoutLog(logId: string, updateData: {
    activity_name?: string;
    duration_minutes?: number;
    calories_burned?: number;
    exercises?: ExerciseData[];
    notes?: string;
  }) {
    try {
      const response = await apiClient.put(`/health/fitness-logs/${logId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Failed to update workout log:', error);
      throw error;
    }
  },

  // Delete workout log
  async deleteWorkoutLog(logId: string) {
    try {
      await apiClient.delete(`/health/fitness-logs/${logId}`);
    } catch (error) {
      console.error('Failed to delete workout log:', error);
      throw error;
    }
  },

  // Get workout statistics
  async getWorkoutStats(period: 'week' | 'month' | 'year' = 'month'): Promise<WorkoutStats> {
    try {
      const response = await apiClient.get(`/health/fitness-logs/stats?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch workout stats:', error);
      throw error;
    }
  },

  // Get today's workout summary
  async getTodayWorkoutSummary() {
    try {
      const response = await apiClient.get('/health/fitness-logs/today');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch today\'s workout summary:', error);
      throw error;
    }
  },

  // Get recent workouts
  async getRecentWorkouts(limit: number = 5) {
    try {
      const response = await apiClient.get(`/health/fitness-logs/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch recent workouts:', error);
      throw error;
    }
  },

  // Get last instance of each exercise from user's workout logs
  async getLastExerciseInstances(exerciseNames: string[]): Promise<{ [exerciseName: string]: any }> {
    try {
      // Get recent workout logs (last 30 workouts should be enough)
      const recentLogs = await this.getRecentWorkouts(30);
      
      const lastInstances: { [exerciseName: string]: any } = {};
      
      // Process each workout log to find the last instance of each exercise
      for (const log of recentLogs) {
        if (log.exercises) {
          let exercises = [];
          try {
            exercises = typeof log.exercises === 'string' ? JSON.parse(log.exercises) : log.exercises;
          } catch (error) {
            continue;
          }
          
          for (const exercise of exercises) {
            const exerciseName = exercise.exercise_name;
            if (exerciseNames.includes(exerciseName) && !lastInstances[exerciseName]) {
              lastInstances[exerciseName] = {
                sets: exercise.sets || 0,
                reps: exercise.reps || '',
                weight_used: exercise.weight_used || 0,
                notes: exercise.notes || ''
              };
            }
          }
        }
      }
      
      return lastInstances;
    } catch (error) {
      console.error('Failed to fetch last exercise instances:', error);
      return {};
    }
  },

  // Get workout by ID
  async getWorkoutById(logId: string): Promise<WorkoutLog> {
    try {
      const response = await apiClient.get(`/health/fitness-logs/${logId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch workout by ID:', error);
      throw error;
    }
  },

  // Get activity types
  async getActivityTypes() {
    try {
      const response = await apiClient.get('/health/fitness-logs/activity-types');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch activity types:', error);
      throw error;
    }
  },

  // Quick log workout (simplified)
  async quickLogWorkout(activityType: string, duration: number, calories?: number) {
    try {
      const workoutData = {
        activity_type: activityType,
        duration_minutes: duration,
        calories_burned: calories,
        activity_date: new Date().toISOString(),
      };
      return await this.logWorkout(workoutData);
    } catch (error) {
      console.error('Failed to quick log workout:', error);
      throw error;
    }
  },

  // Get workout streaks
  async getWorkoutStreaks() {
    try {
      const response = await apiClient.get('/health/fitness-logs/streaks');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch workout streaks:', error);
      throw error;
    }
  },

  // Get monthly workout calendar
  async getMonthlyCalendar(year: number, month: number) {
    try {
      const response = await apiClient.get(`/health/fitness-logs/calendar?year=${year}&month=${month}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch monthly calendar:', error);
      throw error;
    }
  },

  // Search exercises
  async searchExercises(query: string, limit: number = 8) {
    try {
      const response = await apiClient.get(`/health/exercises/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      return response.data.exercises;
    } catch (error) {
      console.error('Failed to search exercises:', error);
      throw error;
    }
  },

  // Get all exercises
  async getAllExercises(limit: number = 700) {
    try {
      const response = await apiClient.get(`/health/exercises/all?limit=${limit}`);
      return response.data.exercises;
    } catch (error) {
      console.error('Failed to fetch all exercises:', error);
      throw error;
    }
  },
};
