/**
 * Body Type Goals API Service
 * Fetches body type goals from the backend API
 */

import { api } from './api';


import { DebugUtils } from '../utils/debugUtils';

export interface RangeValue {
  min: number;
  max: number;
  recommended: number;
  unit: string;
}

export interface BodyTypeGoalTargetAttributes {
  // BMI ranges
  target_bmi_range: RangeValue;

  // Gender-specific body fat ranges
  body_fat_range_men: RangeValue;
  body_fat_range_women: RangeValue;

  // Gender-specific FFMI ranges
  ffmi_range_men: RangeValue;
  ffmi_range_women: RangeValue;

  // SMM level
  smm_level: string;

  // Gender-specific protein requirements
  protein_per_kg_men: RangeValue;
  protein_per_kg_women: RangeValue;

  // Calorie targets
  calorie_target: string;

  // Workout focus
  workout_focus: string;
  workout_frequency: RangeValue;
  cardio_minutes: RangeValue;
  strength_sessions: RangeValue;

  // Additional metrics
  water_goal: RangeValue;
  sleep_duration: RangeValue;
  daily_steps: RangeValue;
  recovery_days: RangeValue;
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
  target_attributes: BodyTypeGoalTargetAttributes | string; // Can be JSON string or object
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
      DebugUtils.log('🎯 Fetching body type goals from API...');
      const response = await api.get<BodyTypeGoalList>('/api/v1/health/data/body-type-goals');

      DebugUtils.log('🎯 Body type goals fetched successfully:', response.body_type_goals.length);
      return response.body_type_goals;
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw new Error('Failed to fetch body type goals');
    }
  }

  /**
   * Fetch system-created body type goals
   */
  async getSystemBodyTypeGoals(): Promise<BodyTypeGoal[]> {
    try {
      DebugUtils.log('🎯 Fetching system body type goals from API...');
      const response = await api.get<BodyTypeGoal[]>('/api/v1/health/data/body-type-goals/system');

      DebugUtils.log('🎯 System body type goals fetched successfully:', response.length);
      return response;
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw new Error('Failed to fetch system body type goals');
    }
  }

  /**
   * Fetch body type goals by category
   */
  async getBodyTypeGoalsByCategory(category: string): Promise<BodyTypeGoal[]> {
    try {
      DebugUtils.log(`🎯 Fetching body type goals for category: ${category}`);
      const response = await api.get<BodyTypeGoalList>(`/api/v1/health/data/body-type-goals?category=${category}`);

      DebugUtils.log(`🎯 Body type goals for category ${category} fetched successfully:`, response.body_type_goals.length);
      return response.body_type_goals;
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw new Error(`Failed to fetch body type goals for category ${category}`);
    }
  }

  /**
   * Get a specific body type goal by ID
   */
  async getBodyTypeGoalById(id: string): Promise<BodyTypeGoal | null> {
    try {
      DebugUtils.log(`🎯 Fetching body type goal: ${id}`);
      const response = await api.get<BodyTypeGoal>(`/api/v1/health/data/body-type-goals/${id}`);

      DebugUtils.log(`🎯 Body type goal ${id} fetched successfully`);
      return response;
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      return null;
    }
  }
}

export const bodyTypeGoalsApiService = new BodyTypeGoalsApiService();
export default bodyTypeGoalsApiService;
