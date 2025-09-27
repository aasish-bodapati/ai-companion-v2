import api from '@/lib/api';
import { logger } from '@/lib/logger';

export interface WorkoutLog {
  id: string;
  user_id: string;
  routine_id?: string;
  routine_name?: string;
  workout_name?: string;
  exercises?: Array<{
    exercise_name: string;
    sets: number;
    reps: string;
    weight_used?: number;
    notes?: string;
  }>;
  duration_minutes?: number;
  calories_burned?: number;
  difficulty_rating?: number;
  notes?: string;
  logged_at?: string;
  activity_date?: string;
  created_at: string;
  unit?: string;
}

export interface FitnessStats {
  totalWorkouts: number;
  totalDuration: number;
  totalCalories: number;
  averageDifficulty: number;
  currentStreak: number;
}

export interface FitnessLogsResponse {
  logs: WorkoutLog[];
  stats: FitnessStats;
}

export interface CreateWorkoutLogData {
  activity_name: string;
  duration_minutes: number;
  calories_burned: number;
  notes?: string;
  activity_type: string;
  activity_date?: string;
  exercises?: Array<{
    exercise_name: string;
    sets: number;
    reps: number;
    weight_used?: number;
    notes?: string;
  }>;
  unit?: string;
}

export interface UpdateWorkoutLogData {
  activity_name: string;
  duration_minutes: number;
  calories_burned: number;
  notes?: string;
  activity_type: string;
  exercises?: Array<{
    exercise_name: string;
    sets: number;
    reps: number;
    weight_used?: number;
    notes?: string;
  }>;
  unit?: string;
}

class FitnessLogsService {
  /**
   * Load fitness logs with optional period and size parameters
   */
  async loadLogs(period: string = 'month', size: number = 50): Promise<FitnessLogsResponse> {
    try {
      logger.debug('Loading fitness logs...', { period, size });
      
      const response = await api.get(`/health/fitness-logs/?period=${period}&size=${size}`, { 
        timeoutMs: 10000 
      });
      
      // Handle both old and new API response formats
      if (response.logs) {
        return {
          logs: response.logs || [],
          stats: response.stats || this.getDefaultStats()
        };
      } else if (Array.isArray(response)) {
        // Old API format - direct array
        return {
          logs: response || [],
          stats: this.getDefaultStats()
        };
      } else {
        return {
          logs: [],
          stats: this.getDefaultStats()
        };
      }
    } catch (error) {
      logger.error('Failed to load fitness logs:', error);
      throw new Error('Failed to load workout logs');
    }
  }

  /**
   * Create a new workout log
   */
  async createLog(logData: CreateWorkoutLogData): Promise<WorkoutLog> {
    try {
      logger.debug('Creating workout log...', logData);
      
      const response = await api.post('/health/fitness-logs/', logData);
      
      logger.debug('Workout log created successfully:', response);
      return response;
    } catch (error) {
      logger.error('Failed to create workout log:', error);
      throw new Error('Failed to create workout log');
    }
  }

  /**
   * Update an existing workout log
   */
  async updateLog(logId: string, updateData: UpdateWorkoutLogData): Promise<WorkoutLog> {
    try {
      logger.debug('Updating workout log...', { logId, updateData });
      
      const response = await api.put(`/health/fitness-logs/${logId}`, updateData);
      
      logger.debug('Workout log updated successfully:', response);
      return response;
    } catch (error) {
      logger.error('Failed to update workout log:', error);
      throw new Error('Failed to update workout log');
    }
  }

  /**
   * Delete a workout log
   */
  async deleteLog(logId: string): Promise<void> {
    try {
      logger.debug('Deleting workout log...', { logId });
      
      await api.delete(`/health/fitness-logs/${logId}`);
      
      logger.debug('Workout log deleted successfully');
    } catch (error) {
      logger.error('Failed to delete workout log:', error);
      throw new Error('Failed to delete workout log');
    }
  }

  /**
   * Delete multiple workout logs
   */
  async deleteMultipleLogs(logIds: string[]): Promise<void> {
    try {
      logger.debug('Deleting multiple workout logs...', { logIds });
      
      const deletePromises = logIds.map(logId => this.deleteLog(logId));
      await Promise.all(deletePromises);
      
      logger.debug('Multiple workout logs deleted successfully');
    } catch (error) {
      logger.error('Failed to delete multiple workout logs:', error);
      throw new Error('Failed to delete some workout logs');
    }
  }

  /**
   * Get default stats when no data is available
   */
  private getDefaultStats(): FitnessStats {
    return {
      totalWorkouts: 0,
      totalDuration: 0,
      totalCalories: 0,
      averageDifficulty: 0,
      currentStreak: 0
    };
  }
}

export const fitnessLogsService = new FitnessLogsService();
