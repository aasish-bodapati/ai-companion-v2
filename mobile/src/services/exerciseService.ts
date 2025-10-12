/**
 * Exercise service for fetching exercise data from the backend
 */

import { api } from './api';


import { DebugUtils } from '../utils/debugUtils';

export interface Exercise {
  id: number;
  name: string;
  logging_category: string;
}

class ExerciseService {
  /**
   * Get exercise by ID
   */
  async getExerciseById(id: string | number): Promise<Exercise | null> {
    try {
      const response = await api.get(`/api/v1/health/exercises/${id}`);
      return {
        id: response.id,
        name: response.name,
        logging_category: response.logging_category
      };
    } catch {
      DebugUtils.warn(`Exercise with ID ${id} not found`);
      return null;
    }
  }

  /**
   * Get multiple exercises by IDs
   */
  async getExercisesByIds(ids: (string | number)[]): Promise<Exercise[]> {
    try {
      // Fetch all exercises in parallel
      const promises = ids.map(id => this.getExerciseById(id));
      const results = await Promise.all(promises);

      // Filter out null results
      return results.filter((exercise): exercise is Exercise => exercise !== null);
    } catch {
      DebugUtils.error('Error fetching exercises:', error);
      return [];
    }
  }

  /**
   * Get all exercises (for search/selection)
   */
  async getAllExercises(): Promise<Exercise[]> {
    try {
      const response = await api.get('/api/v1/health/exercises');
      return response;
    } catch {
      DebugUtils.error('Error fetching all exercises:', error);
      return [];
    }
  }
}

export const exerciseService = new ExerciseService();
