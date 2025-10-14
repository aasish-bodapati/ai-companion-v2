/**
 * Custom Body Type Goal Service
 * Handles creation and management of custom body type goals
 */

import { api } from './api';

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
  target_attributes: BodyTypeGoalTargetAttributes;
  created_by: string;
  is_active: boolean;
  sort_order: number;
}

export interface CreateBodyTypeGoalRequest {
  name: string;
  description: string;
  icon?: string;
  color?: string;
  target_bmi: number;
  target_body_fat?: number;
  target_attributes: BodyTypeGoalTargetAttributes;
}

class CustomBodyTypeGoalService {
  /**
   * Get all body type goals (system + custom)
   */
  async getAllGoals(): Promise<BodyTypeGoal[]> {
    try {
      const response = await api.get('/api/v1/health/body-type-goals/');
      return response;
    } catch (error) {
      console.error('Error fetching body type goals:', error);
      throw error;
    }
  }

  /**
   * Get system body type goals only
   */
  async getSystemGoals(): Promise<BodyTypeGoal[]> {
    try {
      const response = await api.get('/api/v1/health/body-type-goals/system');
      return response;
    } catch (error) {
      console.error('Error fetching system goals:', error);
      throw error;
    }
  }

  /**
   * Get user's custom body type goals
   */
  async getUserGoals(): Promise<BodyTypeGoal[]> {
    try {
      const response = await api.get('/api/v1/health/body-type-goals/user');
      return response;
    } catch (error) {
      console.error('Error fetching user goals:', error);
      throw error;
    }
  }

  /**
   * Get a specific body type goal by ID
   */
  async getGoalById(goalId: string): Promise<BodyTypeGoal> {
    try {
      const response = await api.get(`/api/v1/health/body-type-goals/${goalId}`);
      return response;
    } catch (error) {
      console.error('Error fetching goal by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new custom body type goal
   */
  async createGoal(goalData: CreateBodyTypeGoalRequest): Promise<BodyTypeGoal> {
    try {
      const response = await api.post('/api/v1/health/body-type-goals/', goalData);
      return response;
    } catch (error) {
      console.error('Error creating custom goal:', error);
      throw error;
    }
  }

  /**
   * Update a custom body type goal
   */
  async updateGoal(goalId: string, goalData: CreateBodyTypeGoalRequest): Promise<BodyTypeGoal> {
    try {
      const response = await api.put(`/api/v1/health/body-type-goals/${goalId}`, goalData);
      return response;
    } catch (error) {
      console.error('Error updating custom goal:', error);
      throw error;
    }
  }

  /**
   * Delete a custom body type goal
   */
  async deleteGoal(goalId: string): Promise<void> {
    try {
      await api.delete(`/api/v1/health/body-type-goals/${goalId}`);
    } catch (error) {
      console.error('Error deleting custom goal:', error);
      throw error;
    }
  }

  /**
   * Generate default target attributes for a custom goal
   */
  generateDefaultTargetAttributes(
    targetBMI: number,
    targetBodyFat?: number,
    gender: 'male' | 'female' = 'male'
  ): BodyTypeGoalTargetAttributes {
    const isMale = gender === 'male';
    
    return {
      target_bmi_range: {
        min: Math.max(18, targetBMI - 2),
        max: Math.min(30, targetBMI + 2),
        recommended: targetBMI,
        unit: 'kg/m²'
      },
      body_fat_range_men: {
        min: Math.max(8, (targetBodyFat || 15) - 5),
        max: Math.min(25, (targetBodyFat || 15) + 5),
        recommended: targetBodyFat || 15,
        unit: '%'
      },
      body_fat_range_women: {
        min: Math.max(12, (targetBodyFat || 20) - 5),
        max: Math.min(30, (targetBodyFat || 20) + 5),
        recommended: targetBodyFat || 20,
        unit: '%'
      },
      ffmi_range_men: {
        min: 16,
        max: 22,
        recommended: 19,
        unit: 'kg/m²'
      },
      ffmi_range_women: {
        min: 12,
        max: 18,
        recommended: 15,
        unit: 'kg/m²'
      },
      smm_level: 'moderate',
      protein_per_kg_men: {
        min: 1.6,
        max: 2.2,
        recommended: 1.8,
        unit: 'g/kg'
      },
      protein_per_kg_women: {
        min: 1.4,
        max: 2.0,
        recommended: 1.6,
        unit: 'g/kg'
      },
      calorie_target: 'maintenance',
      workout_focus: 'balanced strength and cardio',
      workout_frequency: {
        min: 3,
        max: 5,
        recommended: 4,
        unit: 'days/week'
      },
      cardio_minutes: {
        min: 150,
        max: 300,
        recommended: 225,
        unit: 'min/week'
      },
      strength_sessions: {
        min: 2,
        max: 4,
        recommended: 3,
        unit: 'sessions/week'
      },
      water_goal: {
        min: 2.5,
        max: 3.5,
        recommended: 3.0,
        unit: 'L/day'
      },
      sleep_duration: {
        min: 7,
        max: 9,
        recommended: 8,
        unit: 'hours'
      },
      daily_steps: {
        min: 8000,
        max: 12000,
        recommended: 10000,
        unit: 'steps'
      },
      recovery_days: {
        min: 1,
        max: 3,
        recommended: 2,
        unit: 'days/week'
      }
    };
  }

  /**
   * Validate goal data before creation
   */
  validateGoalData(goalData: CreateBodyTypeGoalRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!goalData.name || goalData.name.trim().length < 3) {
      errors.push('Goal name must be at least 3 characters long');
    }

    if (!goalData.icon || goalData.icon.trim().length === 0) {
      errors.push('Please select an icon for your goal');
    }

    if (!goalData.color || goalData.color.trim().length === 0) {
      errors.push('Please select a color for your goal');
    }

    if (goalData.target_bmi <= 0) {
      errors.push('Please enter a valid target BMI');
    } else if (goalData.target_bmi < 15 || goalData.target_bmi > 35) {
      errors.push('Target BMI must be between 15 and 35');
    }

    if (goalData.target_body_fat && (goalData.target_body_fat < 5 || goalData.target_body_fat > 40)) {
      errors.push('Target body fat percentage must be between 5% and 40%');
    }

    if (!goalData.target_attributes) {
      errors.push('Target attributes are required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const customBodyTypeGoalService = new CustomBodyTypeGoalService();
