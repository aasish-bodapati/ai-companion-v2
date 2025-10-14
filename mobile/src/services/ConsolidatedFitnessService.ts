/**
 * Consolidated Fitness Service
 * 
 * Combines:
 * - FitnessService (workout logging, exercise data)
 * - ExerciseService (exercise management)
 * - RoutineService (workout routines)
 * - ExerciseCategoryService (exercise categories)
 */

import { api } from './api';
import { DebugUtils } from '../utils/debugUtils';

// ===== TYPES =====

export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_groups: string[];
  equipment?: string;
  instructions?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface ExerciseCategory {
  id: string;
  name: string;
  description?: string;
  muscle_group?: string;
}

export interface WorkoutLog {
  id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  weight?: number;
  duration?: number;
  notes?: string;
  created_at: string;
}

export interface SimpleRoutine {
  id: string;
  name: string;
  description?: string;
  exercises: Exercise[];
  duration_minutes?: number;
  difficulty?: string;
  is_active?: boolean;
}

export interface TodaysWorkout {
  routine_id: string;
  routine_name: string;
  exercises: Array<{
    exercise_id: string;
    exercise_name: string;
    sets: number;
    reps: number;
    weight?: number;
    completed: boolean;
  }>;
  total_duration?: number;
  completed_at?: string;
}

// ===== CONSOLIDATED FITNESS SERVICE =====

class ConsolidatedFitnessService {
  // ===== EXERCISE MANAGEMENT =====
  
  async getExercises(): Promise<Exercise[]> {
    try {
      const response = await api.get('/api/v1/fitness/exercises');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch exercises:', error);
      throw error;
    }
  }

  async getExerciseById(id: string): Promise<Exercise> {
    try {
      const response = await api.get(`/api/v1/fitness/exercises/${id}`);
      return response;
    } catch (error) {
      DebugUtils.error(`Failed to fetch exercise ${id}:`, error);
      throw error;
    }
  }

  async getExerciseCategories(): Promise<ExerciseCategory[]> {
    try {
      const response = await api.get('/api/v1/fitness/exercise-categories');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch exercise categories:', error);
      throw error;
    }
  }

  // ===== WORKOUT LOGGING =====

  async logWorkout(workoutData: {
    exercise_id: string;
    sets: number;
    reps: number;
    weight?: number;
    duration?: number;
    notes?: string;
  }): Promise<WorkoutLog> {
    try {
      const response = await api.post('/api/v1/fitness/workouts/log', workoutData);
      DebugUtils.log('Workout logged successfully:', response);
      return response;
    } catch (error) {
      DebugUtils.error('Failed to log workout:', error);
      throw error;
    }
  }

  async getWorkoutLogs(date?: string): Promise<WorkoutLog[]> {
    try {
      const params = date ? { date } : {};
      const response = await api.get('/api/v1/fitness/workouts/logs', { params });
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch workout logs:', error);
      throw error;
    }
  }

  // ===== ROUTINE MANAGEMENT =====

  async getRoutines(): Promise<SimpleRoutine[]> {
    try {
      const response = await api.get('/api/v1/fitness/routines');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch routines:', error);
      throw error;
    }
  }

  async getRoutineById(id: string): Promise<SimpleRoutine> {
    try {
      const response = await api.get(`/api/v1/fitness/routines/${id}`);
      return response;
    } catch (error) {
      DebugUtils.error(`Failed to fetch routine ${id}:`, error);
      throw error;
    }
  }

  async createRoutine(routineData: {
    name: string;
    description?: string;
    exercises: Array<{
      exercise_id: string;
      sets: number;
      reps: number;
      weight?: number;
    }>;
  }): Promise<SimpleRoutine> {
    try {
      const response = await api.post('/api/v1/fitness/routines', routineData);
      DebugUtils.log('Routine created successfully:', response);
      return response;
    } catch (error) {
      DebugUtils.error('Failed to create routine:', error);
      throw error;
    }
  }

  async updateRoutine(id: string, routineData: Partial<SimpleRoutine>): Promise<SimpleRoutine> {
    try {
      const response = await api.put(`/api/v1/fitness/routines/${id}`, routineData);
      DebugUtils.log('Routine updated successfully:', response);
      return response;
    } catch (error) {
      DebugUtils.error(`Failed to update routine ${id}:`, error);
      throw error;
    }
  }

  async deleteRoutine(id: string): Promise<void> {
    try {
      await api.delete(`/api/v1/fitness/routines/${id}`);
      DebugUtils.log('Routine deleted successfully');
    } catch (error) {
      DebugUtils.error(`Failed to delete routine ${id}:`, error);
      throw error;
    }
  }

  // ===== ACTIVE ROUTINE MANAGEMENT =====

  async getActiveRoutine(): Promise<SimpleRoutine | null> {
    try {
      const response = await api.get('/api/v1/fitness/active-routine');
      return response.active_routine || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No active routine
      }
      DebugUtils.error('Failed to fetch active routine:', error);
      throw error;
    }
  }

  async setActiveRoutine(routineId: string): Promise<void> {
    try {
      await api.post('/api/v1/fitness/active-routine', { routine_id: routineId });
      DebugUtils.log('Active routine set successfully');
    } catch (error) {
      DebugUtils.error('Failed to set active routine:', error);
      throw error;
    }
  }

  async clearActiveRoutine(): Promise<void> {
    try {
      await api.delete('/api/v1/fitness/active-routine');
      DebugUtils.log('Active routine cleared successfully');
    } catch (error) {
      DebugUtils.error('Failed to clear active routine:', error);
      throw error;
    }
  }

  // ===== TODAY'S WORKOUT =====

  async getTodaysWorkout(): Promise<TodaysWorkout | null> {
    try {
      const response = await api.get('/api/v1/fitness/todays-workout');
      return response;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No workout scheduled for today
      }
      DebugUtils.error('Failed to fetch today\'s workout:', error);
      throw error;
    }
  }

  async completeWorkout(workoutData: {
    routine_id: string;
    exercises: Array<{
      exercise_id: string;
      sets: number;
      reps: number;
      weight?: number;
      completed: boolean;
    }>;
    duration_minutes?: number;
  }): Promise<void> {
    try {
      await api.post('/api/v1/fitness/workouts/complete', workoutData);
      DebugUtils.log('Workout completed successfully');
    } catch (error) {
      DebugUtils.error('Failed to complete workout:', error);
      throw error;
    }
  }

  // ===== MOOD LOGGING (from FitnessService) =====

  async logMood(moodData: {
    mood_rating: number;
    energy_level?: number;
    activities?: string[];
    notes?: string;
  }): Promise<void> {
    try {
      await api.post('/api/v1/fitness/mood', moodData);
      DebugUtils.log('Mood logged successfully');
    } catch (error) {
      DebugUtils.error('Failed to log mood:', error);
      throw error;
    }
  }

  // ===== STATISTICS =====

  async getWorkoutStats(period: 'week' | 'month' | 'year' = 'week'): Promise<{
    total_workouts: number;
    total_duration: number;
    calories_burned: number;
    strength_gains: Array<{
      exercise_name: string;
      improvement_percentage: number;
    }>;
  }> {
    try {
      const response = await api.get(`/api/v1/fitness/stats/${period}`);
      return response;
    } catch (error) {
      DebugUtils.error(`Failed to fetch ${period} stats:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const fitnessService = new ConsolidatedFitnessService();
export default fitnessService;
