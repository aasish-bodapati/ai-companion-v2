/**
 * Consolidated Nutrition Service
 * 
 * Combines:
 * - NutritionService (meal logging, nutrition tracking)
 * - IndianFoodService (Indian food database)
 * - LocalFoodService (local food database)
 * - NutritionGoalsService (nutrition goals)
 */

import { api } from './api';
import { DebugUtils } from '../utils/debugUtils';

// ===== TYPES =====

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
  sugar_per_100g?: number;
  sodium_per_100g?: number;
  serving_size?: string;
  is_indian?: boolean;
  is_local?: boolean;
}

export interface NutritionLog {
  id: number;
  user_id: number;
  meal_type: string;
  meal_name?: string;
  total_calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  food_items: string;
  notes?: string;
  mood_before?: string;
  mood_after?: string;
  created_at: string;
}

export interface MealLog {
  id: string;
  food_id: string;
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  logged_at: string;
  notes?: string;
}

export interface NutritionGoals {
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
  daily_fiber?: number;
  daily_sugar?: number;
  daily_sodium?: number;
}

export interface NutritionStats {
  today: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  goals: NutritionGoals;
  progress_percentage: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface WeeklyNutritionData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals_count: number;
}

// ===== CONSOLIDATED NUTRITION SERVICE =====

class ConsolidatedNutritionService {
  // ===== FOOD DATABASE =====

  async searchFood(query: string, filters?: {
    category?: string;
    is_indian?: boolean;
    is_local?: boolean;
  }): Promise<FoodItem[]> {
    try {
      const params = { q: query, ...filters };
      const response = await api.get('/api/v1/nutrition/foods/search', { params });
      return response;
    } catch (error) {
      DebugUtils.error('Failed to search food:', error);
      throw error;
    }
  }

  async getFoodById(id: string): Promise<FoodItem> {
    try {
      const response = await api.get(`/api/v1/nutrition/foods/${id}`);
      return response;
    } catch (error) {
      DebugUtils.error(`Failed to fetch food ${id}:`, error);
      throw error;
    }
  }

  async getIndianFoods(category?: string): Promise<FoodItem[]> {
    try {
      const params = category ? { category } : {};
      const response = await api.get('/api/v1/nutrition/foods/indian', { params });
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch Indian foods:', error);
      throw error;
    }
  }

  async getLocalFoods(category?: string): Promise<FoodItem[]> {
    try {
      const params = category ? { category } : {};
      const response = await api.get('/api/v1/nutrition/foods/local', { params });
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch local foods:', error);
      throw error;
    }
  }

  async getFoodCategories(): Promise<string[]> {
    try {
      const response = await api.get('/api/v1/nutrition/foods/categories');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch food categories:', error);
      throw error;
    }
  }

  // ===== MEAL LOGGING =====

  async logMeal(mealData: {
    food_id: string;
    quantity: number;
    unit: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    notes?: string;
  }): Promise<MealLog> {
    try {
      const response = await api.post('/api/v1/nutrition/meals/log', mealData);
      DebugUtils.log('Meal logged successfully:', response);
      return response;
    } catch (error) {
      DebugUtils.error('Failed to log meal:', error);
      throw error;
    }
  }

  async getMealLogs(date?: string): Promise<MealLog[]> {
    try {
      const params = date ? { date } : {};
      const response = await api.get('/api/v1/nutrition/meals/logs', { params });
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch meal logs:', error);
      throw error;
    }
  }

  async updateMealLog(id: string, mealData: Partial<MealLog>): Promise<MealLog> {
    try {
      const response = await api.put(`/api/v1/nutrition/meals/logs/${id}`, mealData);
      DebugUtils.log('Meal log updated successfully:', response);
      return response;
    } catch (error) {
      DebugUtils.error(`Failed to update meal log ${id}:`, error);
      throw error;
    }
  }

  async deleteMealLog(id: string): Promise<void> {
    try {
      await api.delete(`/api/v1/nutrition/meals/logs/${id}`);
      DebugUtils.log('Meal log deleted successfully');
    } catch (error) {
      DebugUtils.error(`Failed to delete meal log ${id}:`, error);
      throw error;
    }
  }

  // ===== NUTRITION GOALS =====

  async getNutritionGoals(): Promise<NutritionGoals> {
    try {
      const response = await api.get('/api/v1/nutrition/goals');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch nutrition goals:', error);
      throw error;
    }
  }

  async setNutritionGoals(goals: Partial<NutritionGoals>): Promise<NutritionGoals> {
    try {
      const response = await api.put('/api/v1/nutrition/goals', goals);
      DebugUtils.log('Nutrition goals updated successfully:', response);
      return response;
    } catch (error) {
      DebugUtils.error('Failed to set nutrition goals:', error);
      throw error;
    }
  }

  // ===== NUTRITION STATS =====

  async getTodayStats(): Promise<NutritionStats> {
    try {
      const response = await api.get('/api/v1/nutrition/stats/today');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch today\'s nutrition stats:', error);
      throw error;
    }
  }

  async getWeeklyStats(): Promise<WeeklyNutritionData[]> {
    try {
      const response = await api.get('/api/v1/nutrition/stats/week');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch weekly nutrition stats:', error);
      throw error;
    }
  }

  async getMonthlyStats(): Promise<WeeklyNutritionData[]> {
    try {
      const response = await api.get('/api/v1/nutrition/stats/month');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch monthly nutrition stats:', error);
      throw error;
    }
  }

  // ===== QUICK ADD MEALS =====

  async quickAddMeal(mealData: {
    food_name: string;
    quantity: number;
    unit: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }): Promise<MealLog> {
    try {
      const response = await api.post('/api/v1/nutrition/meals/quick-add', mealData);
      DebugUtils.log('Quick meal added successfully:', response);
      return response;
    } catch (error) {
      DebugUtils.error('Failed to quick add meal:', error);
      throw error;
    }
  }

  // ===== NUTRITION ANALYSIS =====

  async getNutritionAnalysis(period: 'week' | 'month' = 'week'): Promise<{
    average_daily_calories: number;
    average_daily_protein: number;
    average_daily_carbs: number;
    average_daily_fat: number;
    goal_achievement: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    recommendations: string[];
    trends: {
      calories_trend: 'increasing' | 'decreasing' | 'stable';
      protein_trend: 'increasing' | 'decreasing' | 'stable';
      carbs_trend: 'increasing' | 'decreasing' | 'stable';
      fat_trend: 'increasing' | 'decreasing' | 'stable';
    };
  }> {
    try {
      const response = await api.get(`/api/v1/nutrition/analysis/${period}`);
      return response;
    } catch (error) {
      DebugUtils.error(`Failed to fetch ${period} nutrition analysis:`, error);
      throw error;
    }
  }

  // ===== MEAL PLANNING =====

  async generateMealPlan(goals: NutritionGoals, preferences?: {
    dietary_restrictions?: string[];
    cuisine_preferences?: string[];
    meal_count?: number;
  }): Promise<{
    meals: Array<{
      meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      foods: Array<{
        food_id: string;
        food_name: string;
        quantity: number;
        unit: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      }>;
      total_calories: number;
      total_protein: number;
      total_carbs: number;
      total_fat: number;
    }>;
    total_daily_calories: number;
    total_daily_protein: number;
    total_daily_carbs: number;
    total_daily_fat: number;
  }> {
    try {
      const response = await api.post('/api/v1/nutrition/meal-plan', {
        goals,
        preferences
      });
      return response;
    } catch (error) {
      DebugUtils.error('Failed to generate meal plan:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const nutritionService = new ConsolidatedNutritionService();
export default nutritionService;
