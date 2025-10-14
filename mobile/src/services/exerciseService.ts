/**
 * Exercise service for fetching exercise data from ExerciseDB via backend
 */

import { api } from './api';
import { DebugUtils } from '../utils/debugUtils';

export interface Exercise {
  id: string;  // ExerciseDB exerciseId
  name: string;
  logging_category: string;
  category?: string;
  muscle_group?: string;
  equipment?: string;
  instructions?: string[];
  difficulty?: string;
  gif_url?: string;
  target_muscles?: string[];
  secondary_muscles?: string[];
  body_parts?: string[];
}

export interface ExerciseSearchParams {
  q?: string;
  body_part?: string;
  equipment?: string;
  target_muscle?: string;
  limit?: number;
  page?: number;
}

export interface ExerciseSearchResponse {
  exercises: Exercise[];
  total: number;
  page: number;
  limit: number;
}

class ExerciseService {
  /**
   * Get exercise by ExerciseDB ID
   */
  async getExerciseById(id: string): Promise<Exercise | null> {
    try {
      const response = await api.get(`/api/v1/health/exercises/${id}`);
      return this._mapExerciseResponse(response);
    } catch (error) {
      DebugUtils.warn(`Exercise with ID ${id} not found:`, error);
      return null;
    }
  }

  /**
   * Get multiple exercises by IDs
   */
  async getExercisesByIds(ids: string[]): Promise<Exercise[]> {
    try {
      // Fetch all exercises in parallel
      const promises = ids.map(id => this.getExerciseById(id));
      const results = await Promise.all(promises);

      // Filter out null results
      return results.filter((exercise): exercise is Exercise => exercise !== null);
    } catch (error) {
      DebugUtils.error('Error fetching exercises:', error);
      return [];
    }
  }

  /**
   * Get all exercises with optional filtering
   */
  async getAllExercises(params?: ExerciseSearchParams): Promise<Exercise[]> {
    try {
      const response = await api.get('/api/v1/health/exercises/all', { params });
      return response.exercises.map((ex: any) => this._mapExerciseResponse(ex));
    } catch (error) {
      DebugUtils.error('Error fetching all exercises:', error);
      return [];
    }
  }

  /**
   * Search exercises by name with optional filtering
   */
  async searchExercises(params: ExerciseSearchParams): Promise<ExerciseSearchResponse> {
    try {
      const response = await api.get('/api/v1/health/exercises/search', { params });
      return {
        exercises: response.exercises.map((ex: any) => this._mapExerciseResponse(ex)),
        total: response.total,
        page: response.page,
        limit: response.limit
      };
    } catch (error) {
      DebugUtils.error('Error searching exercises:', error);
      return { exercises: [], total: 0, page: 1, limit: 20 };
    }
  }

  /**
   * Get exercises by body part
   */
  async getExercisesByBodyPart(bodyPart: string, limit: number = 50): Promise<Exercise[]> {
    try {
      const response = await api.get(`/api/v1/health/exercises/by-body-part/${bodyPart}`, {
        params: { limit }
      });
      return response.exercises.map((ex: any) => this._mapExerciseResponse(ex));
    } catch (error) {
      DebugUtils.error(`Error fetching exercises for body part ${bodyPart}:`, error);
      return [];
    }
  }

  /**
   * Get exercises by equipment
   */
  async getExercisesByEquipment(equipment: string, limit: number = 50): Promise<Exercise[]> {
    try {
      const response = await api.get(`/api/v1/health/exercises/by-equipment/${equipment}`, {
        params: { limit }
      });
      return response.exercises.map((ex: any) => this._mapExerciseResponse(ex));
    } catch (error) {
      DebugUtils.error(`Error fetching exercises for equipment ${equipment}:`, error);
      return [];
    }
  }

  /**
   * Get exercises by target muscle
   */
  async getExercisesByTargetMuscle(targetMuscle: string, limit: number = 50): Promise<Exercise[]> {
    try {
      const response = await api.get(`/api/v1/health/exercises/by-target-muscle/${targetMuscle}`, {
        params: { limit }
      });
      return response.exercises.map((ex: any) => this._mapExerciseResponse(ex));
    } catch (error) {
      DebugUtils.error(`Error fetching exercises for target muscle ${targetMuscle}:`, error);
      return [];
    }
  }

  /**
   * Get all body parts
   */
  async getBodyParts(): Promise<string[]> {
    try {
      const response = await api.get('/api/v1/health/exercises/body-parts');
      return response.body_parts;
    } catch (error) {
      DebugUtils.error('Error fetching body parts:', error);
      return [];
    }
  }

  /**
   * Get all equipment types
   */
  async getEquipment(): Promise<string[]> {
    try {
      const response = await api.get('/api/v1/health/exercises/equipment');
      return response.equipment;
    } catch (error) {
      DebugUtils.error('Error fetching equipment:', error);
      return [];
    }
  }

  /**
   * Get all muscles
   */
  async getMuscles(): Promise<string[]> {
    try {
      const response = await api.get('/api/v1/health/exercises/muscles');
      return response.muscles;
    } catch (error) {
      DebugUtils.error('Error fetching muscles:', error);
      return [];
    }
  }

  /**
   * Get exercise categories
   */
  async getCategories(): Promise<any[]> {
    try {
      const response = await api.get('/api/v1/health/exercises/categories');
      return response.categories;
    } catch (error) {
      DebugUtils.error('Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Map API response to Exercise interface
   */
  private _mapExerciseResponse(response: any): Exercise {
    return {
      id: response.id || '',
      name: response.name || '',
      logging_category: response.logging_category || 'weighted',
      category: response.category,
      muscle_group: response.muscle_group,
      equipment: response.equipment,
      instructions: response.instructions,
      difficulty: response.difficulty,
      gif_url: response.gif_url,
      target_muscles: response.target_muscles,
      secondary_muscles: response.secondary_muscles,
      body_parts: response.body_parts
    };
  }
}

export const exerciseService = new ExerciseService();