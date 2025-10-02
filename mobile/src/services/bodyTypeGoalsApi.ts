/**
 * Body Type Goals API Service
 * Fetches body type goals from the backend API
 */

import { apiClient } from './api';

export interface BodyTypeGoalTargetAttributes {
  target_weight: number;
  weight_change: number;
  water_goal: number; // ml per day
  calorie_target: number;
  protein_target: number; // g per day
  workout_frequency: number; // days per week
  cardio_minutes: number; // minutes per week
  timeline: number; // weeks to reach goal
  waist_to_height_ratio?: number; // Waist-to-height ratio
  fat_free_mass_index?: number; // Fat-Free Mass Index
}

export interface BodyTypeGoal {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  target_bmi: number;
  target_body_fat?: number;
  target_attributes: BodyTypeGoalTargetAttributes;
  created_by: string;
  is_active: boolean;
  sort_order: number;
}

export interface BodyTypeGoalList {
  body_type_goals: BodyTypeGoal[];
  total: number;
}

class BodyTypeGoalsApiService {
  /**
   * Fetch all active body type goals from the backend
   */
  async getBodyTypeGoals(): Promise<BodyTypeGoal[]> {
    try {
      console.log('🎯 Fetching body type goals from API...');
      const response = await apiClient.get<BodyTypeGoalList>('/health/body-type-goals/');
      
      console.log('🎯 Body type goals fetched successfully:', response.data.body_type_goals.length);
      return response.data.body_type_goals;
    } catch (error) {
      console.error('❌ Failed to fetch body type goals:', error);
      throw new Error('Failed to fetch body type goals');
    }
  }

  /**
   * Fetch system-created body type goals
   */
  async getSystemBodyTypeGoals(): Promise<BodyTypeGoal[]> {
    try {
      console.log('🎯 Fetching system body type goals from API...');
      const response = await apiClient.get<BodyTypeGoalList>('/health/body-type-goals/system');
      
      console.log('🎯 System body type goals fetched successfully:', response.data.body_type_goals.length);
      return response.data.body_type_goals;
    } catch (error) {
      console.error('❌ Failed to fetch system body type goals:', error);
      throw new Error('Failed to fetch system body type goals');
    }
  }

  /**
   * Fetch body type goals by category
   */
  async getBodyTypeGoalsByCategory(category: string): Promise<BodyTypeGoal[]> {
    try {
      console.log(`🎯 Fetching body type goals for category: ${category}`);
      const response = await apiClient.get<BodyTypeGoalList>(`/health/body-type-goals/?category=${category}`);
      
      console.log(`🎯 Body type goals for category ${category} fetched successfully:`, response.data.body_type_goals.length);
      return response.data.body_type_goals;
    } catch (error) {
      console.error(`❌ Failed to fetch body type goals for category ${category}:`, error);
      throw new Error(`Failed to fetch body type goals for category ${category}`);
    }
  }

  /**
   * Get a specific body type goal by ID
   */
  async getBodyTypeGoalById(id: string): Promise<BodyTypeGoal | null> {
    try {
      console.log(`🎯 Fetching body type goal: ${id}`);
      const response = await apiClient.get<BodyTypeGoal>(`/health/body-type-goals/${id}`);
      
      console.log(`🎯 Body type goal ${id} fetched successfully`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to fetch body type goal ${id}:`, error);
      return null;
    }
  }
}

export const bodyTypeGoalsApiService = new BodyTypeGoalsApiService();
export default bodyTypeGoalsApiService;
