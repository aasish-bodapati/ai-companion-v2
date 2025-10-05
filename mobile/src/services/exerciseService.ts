/**
 * Exercise service for fetching exercise data from the backend
 */

import { API_BASE_URL } from '../config/api';

export interface Exercise {
  id: number;
  name: string;
  logging_category: string;
}

class ExerciseService {
  private baseUrl = `${API_BASE_URL}/health`;

  /**
   * Get exercise by ID
   */
  async getExerciseById(id: string | number): Promise<Exercise | null> {
    try {
      const response = await fetch(`${this.baseUrl}/exercises/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Exercise with ID ${id} not found`);
        return null;
      }

      const data = await response.json();
      return {
        id: data.id,
        name: data.name,
        logging_category: data.logging_category
      };
    } catch (error) {
      console.error(`Error fetching exercise ${id}:`, error);
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
    } catch (error) {
      console.error('Error fetching exercises:', error);
      return [];
    }
  }

  /**
   * Get all exercises (for search/selection)
   */
  async getAllExercises(): Promise<Exercise[]> {
    try {
      const response = await fetch(`${this.baseUrl}/exercises`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching all exercises:', error);
      return [];
    }
  }
}

export const exerciseService = new ExerciseService();
