/**
 * Consolidated Goals Service
 * 
 * Combines:
 * - NumericalGoalsService (numerical goal tracking)
 * - BodyTypeGoalsService (body type goals)
 * - GoalRecommendationService (goal recommendations)
 * - NutritionGoalsService (nutrition goals)
 */

import { api } from './api';
import { DebugUtils } from '../utils/debugUtils';

// ===== TYPES =====

export interface NumericalGoal {
  id: string;
  name: string;
  target_value: number;
  current_value: number;
  unit: string;
  category: 'fitness' | 'nutrition' | 'health' | 'wellness';
  priority: 'high' | 'medium' | 'low';
  target_date?: string;
  created_at: string;
  updated_at: string;
}

export interface GoalProgress {
  goal_id: string;
  goal_name: string;
  current_value: number;
  target_value: number;
  progress_percentage: number;
  days_remaining?: number;
  status: 'on_track' | 'behind' | 'ahead' | 'completed';
  last_updated: string;
}

export interface BodyTypeGoal {
  id: string;
  name: string;
  description: string;
  target_bmi: number;
  target_body_fat: number;
  target_muscle_mass: number;
  difficulty: 'easy' | 'moderate' | 'hard' | 'extreme';
  timeline_weeks: number;
  is_active: boolean;
}

export interface GoalRecommendation {
  bmi: number;
  bmiCategory: string;
  bodyGoal: string;
  bodyGoalDescription: string;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatsGoal: number;
  tdee: number;
  bmr: number;
  activityGuidance: string;
  phaseDescription: string;
}

export interface NutritionGoals {
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
  daily_fiber?: number;
  daily_sugar?: number;
  daily_sodium?: number;
  weekly_meals: number;
  water_intake_ml: number;
}

export interface GoalAnalytics {
  total_goals: number;
  completed_goals: number;
  on_track_goals: number;
  behind_goals: number;
  average_progress: number;
  needsAttentionGoal?: GoalProgress;
}

// ===== CONSOLIDATED GOALS SERVICE =====

class ConsolidatedGoalsService {
  // ===== NUMERICAL GOALS =====

  async getNumericalGoals(): Promise<NumericalGoal[]> {
    try {
      const response = await api.get('/api/v1/goals/numerical');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch numerical goals:', error);
      throw error;
    }
  }

  async createNumericalGoal(goal: Omit<NumericalGoal, 'id' | 'created_at' | 'updated_at'>): Promise<NumericalGoal> {
    try {
      const response = await api.post('/api/v1/goals/numerical', goal);
      DebugUtils.log('Numerical goal created successfully:', response);
      return response;
    } catch (error) {
      DebugUtils.error('Failed to create numerical goal:', error);
      throw error;
    }
  }

  async updateNumericalGoal(id: string, goal: Partial<NumericalGoal>): Promise<NumericalGoal> {
    try {
      const response = await api.put(`/api/v1/goals/numerical/${id}`, goal);
      DebugUtils.log('Numerical goal updated successfully:', response);
      return response;
    } catch (error) {
      DebugUtils.error(`Failed to update numerical goal ${id}:`, error);
      throw error;
    }
  }

  async deleteNumericalGoal(id: string): Promise<void> {
    try {
      await api.delete(`/api/v1/goals/numerical/${id}`);
      DebugUtils.log('Numerical goal deleted successfully');
    } catch (error) {
      DebugUtils.error(`Failed to delete numerical goal ${id}:`, error);
      throw error;
    }
  }

  async updateGoalProgress(goalId: string, currentValue: number): Promise<GoalProgress> {
    try {
      const response = await api.put(`/api/v1/goals/numerical/${goalId}/progress`, {
        current_value: currentValue
      });
      return response;
    } catch (error) {
      DebugUtils.error(`Failed to update goal progress for ${goalId}:`, error);
      throw error;
    }
  }

  // ===== BODY TYPE GOALS =====

  async getBodyTypeGoals(): Promise<BodyTypeGoal[]> {
    try {
      const response = await api.get('/api/v1/goals/body-type');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch body type goals:', error);
      throw error;
    }
  }

  async getBodyTypeGoalById(id: string): Promise<BodyTypeGoal> {
    try {
      const response = await api.get(`/api/v1/goals/body-type/${id}`);
      return response;
    } catch (error) {
      DebugUtils.error(`Failed to fetch body type goal ${id}:`, error);
      throw error;
    }
  }

  async setActiveBodyTypeGoal(id: string): Promise<void> {
    try {
      await api.post('/api/v1/goals/body-type/active', { goal_id: id });
      DebugUtils.log('Active body type goal set successfully');
    } catch (error) {
      DebugUtils.error('Failed to set active body type goal:', error);
      throw error;
    }
  }

  async getActiveBodyTypeGoal(): Promise<BodyTypeGoal | null> {
    try {
      const response = await api.get('/api/v1/goals/body-type/active');
      return response.goal || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No active goal
      }
      DebugUtils.error('Failed to fetch active body type goal:', error);
      throw error;
    }
  }

  // ===== NUTRITION GOALS =====

  async getNutritionGoals(): Promise<NutritionGoals> {
    try {
      const response = await api.get('/api/v1/goals/nutrition');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch nutrition goals:', error);
      throw error;
    }
  }

  async setNutritionGoals(goals: Partial<NutritionGoals>): Promise<NutritionGoals> {
    try {
      const response = await api.put('/api/v1/goals/nutrition', goals);
      DebugUtils.log('Nutrition goals updated successfully:', response);
      return response;
    } catch (error) {
      DebugUtils.error('Failed to set nutrition goals:', error);
      throw error;
    }
  }

  // ===== GOAL RECOMMENDATIONS =====

  async generateGoalRecommendation(healthData: {
    age: number;
    gender: 'male' | 'female';
    height: number;
    weight: number;
    activityLevel: 'sedentary' | 'light' | 'active' | 'very_active';
  }): Promise<GoalRecommendation> {
    try {
      const response = await api.post('/api/v1/goals/recommendations', healthData);
      return response;
    } catch (error) {
      DebugUtils.error('Failed to generate goal recommendation:', error);
      throw error;
    }
  }

  async getPersonalizedGoals(): Promise<{
    recommended_goals: NumericalGoal[];
    body_type_goal: BodyTypeGoal;
    nutrition_goals: NutritionGoals;
    priority_actions: string[];
  }> {
    try {
      const response = await api.get('/api/v1/goals/personalized');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch personalized goals:', error);
      throw error;
    }
  }

  // ===== GOAL ANALYTICS =====

  async getGoalAnalytics(): Promise<GoalAnalytics> {
    try {
      const response = await api.get('/api/v1/goals/analytics');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch goal analytics:', error);
      throw error;
    }
  }

  async getGoalProgress(period: 'week' | 'month' | 'quarter' = 'month'): Promise<GoalProgress[]> {
    try {
      const response = await api.get(`/api/v1/goals/progress/${period}`);
      return response;
    } catch (error) {
      DebugUtils.error(`Failed to fetch ${period} goal progress:`, error);
      throw error;
    }
  }

  // ===== GOAL CALCULATIONS =====

  calculateBMI(weight: number, height: number): number {
    return weight / ((height / 100) ** 2);
  }

  calculateBMR(weight: number, height: number, age: number, gender: 'male' | 'female'): number {
    const s = gender === 'male' ? 5 : -161;
    return 10 * weight + 6.25 * height - 5 * age + s;
  }

  calculateTDEE(bmr: number, activityLevel: 'sedentary' | 'light' | 'active' | 'very_active'): number {
    const activityFactors = {
      sedentary: 1.2,
      light: 1.375,
      active: 1.55,
      very_active: 1.725
    };
    return bmr * activityFactors[activityLevel];
  }

  calculateGoalProgress(current: number, target: number): number {
    if (target === 0) return 0;
    return Math.min(100, Math.max(0, (current / target) * 100));
  }

  // ===== GOAL TEMPLATES =====

  async getGoalTemplates(category?: 'fitness' | 'nutrition' | 'health' | 'wellness'): Promise<NumericalGoal[]> {
    try {
      const params = category ? { category } : {};
      const response = await api.get('/api/v1/goals/templates', { params });
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch goal templates:', error);
      throw error;
    }
  }

  async createGoalFromTemplate(templateId: string, customizations?: {
    target_value?: number;
    target_date?: string;
    priority?: 'high' | 'medium' | 'low';
  }): Promise<NumericalGoal> {
    try {
      const response = await api.post(`/api/v1/goals/templates/${templateId}/create`, customizations);
      DebugUtils.log('Goal created from template successfully:', response);
      return response;
    } catch (error) {
      DebugUtils.error(`Failed to create goal from template ${templateId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const goalsService = new ConsolidatedGoalsService();
export default goalsService;
