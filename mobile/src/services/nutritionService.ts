import { apiClient } from './api';

export interface NutritionLog {
  id: string;
  user_id: string;
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
  meal_date: string;
  created_at: string;
  updated_at: string;
}

export interface FoodItem {
  id: number;
  name: string;
  brand?: string;
  category: string;
  calories_per_100g: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  serving_size_g: number;
  barcode?: string;
}

export interface NutritionStats {
  total_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  meals_count: number;
  avg_calories_per_meal: number;
}

export interface MealPlan {
  id: string;
  name: string;
  description?: string;
  difficulty: string;
  duration_weeks: number;
  meals: MealPlanMeal[];
}

export interface MealPlanMeal {
  id: string;
  meal_type: string;
  meal_name: string;
  total_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  foods: MealPlanFood[];
}

export interface MealPlanFood {
  id: string;
  food_name: string;
  quantity: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export const nutritionService = {
  async getNutritionLogs(params?: {
    period?: string;
    page?: number;
    size?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<NutritionLog[]> {
    try {
      const response = await apiClient.get('/health/nutrition-logs/', { params });
      return response.data;
    } catch (error) {
      console.error('Nutrition Service: Error fetching logs:', error);
      throw error;
    }
  },

  async getRecentMeals(limit: number = 5): Promise<NutritionLog[]> {
    try {
      const response = await apiClient.get('/health/logging/nutrition', {
        params: { size: limit, page: 1 }
      });
      
      // Extract meals array from response
      const meals = response.data?.meals || response.data || [];
      
      // Ensure it's an array
      if (!Array.isArray(meals)) {
        console.warn('Nutrition Service: Expected array but got:', typeof meals);
        return [];
      }
      
      return meals;
    } catch (error) {
      console.error('Nutrition Service: Error fetching recent meals:', error);
      throw error;
    }
  },

  async getTodayNutritionSummary(): Promise<NutritionStats> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await apiClient.get('/health/logging/nutrition', {
        params: { start_date: today, end_date: today }
      });
      
      const logs = response.data || [];
      const summary: NutritionStats = {
        total_calories: logs.reduce((sum: number, log: NutritionLog) => sum + (log.total_calories || 0), 0),
        protein_g: logs.reduce((sum: number, log: NutritionLog) => sum + (log.protein_g || 0), 0),
        carbs_g: logs.reduce((sum: number, log: NutritionLog) => sum + (log.carbs_g || 0), 0),
        fat_g: logs.reduce((sum: number, log: NutritionLog) => sum + (log.fat_g || 0), 0),
        fiber_g: logs.reduce((sum: number, log: NutritionLog) => sum + (log.fiber_g || 0), 0),
        sugar_g: logs.reduce((sum: number, log: NutritionLog) => sum + (log.sugar_g || 0), 0),
        sodium_mg: logs.reduce((sum: number, log: NutritionLog) => sum + (log.sodium_mg || 0), 0),
        meals_count: logs.length,
        avg_calories_per_meal: logs.length > 0 ? 
          logs.reduce((sum: number, log: NutritionLog) => sum + (log.total_calories || 0), 0) / logs.length : 0
      };
      
      return summary;
    } catch (error) {
      console.error('Nutrition Service: Error fetching today\'s summary:', error);
      return {
        total_calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        sodium_mg: 0,
        meals_count: 0,
        avg_calories_per_meal: 0
      };
    }
  },

  async logMeal(mealData: {
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
    meal_date?: string;
  }): Promise<NutritionLog> {
    try {
      console.log('🍎 Nutrition Service: Logging meal...', mealData);
      const response = await apiClient.post('/health/logging/nutrition', mealData);
      console.log('🍎 Nutrition Service: Meal logged:', response.data);
      return response.data;
    } catch (error) {
      console.error('🍎 Nutrition Service: Error logging meal:', error);
      throw error;
    }
  },

  async updateMeal(id: string, mealData: Partial<NutritionLog>): Promise<NutritionLog> {
    try {
      console.log('🍎 Nutrition Service: Updating meal...', id, mealData);
      const response = await apiClient.put(`/health/logging/nutrition/${id}`, mealData);
      console.log('🍎 Nutrition Service: Meal updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('🍎 Nutrition Service: Error updating meal:', error);
      throw error;
    }
  },

  async deleteMeal(id: string): Promise<void> {
    try {
      console.log('🍎 Nutrition Service: Deleting meal...', id);
      await apiClient.delete(`/health/logging/nutrition/${id}`);
      console.log('🍎 Nutrition Service: Meal deleted');
    } catch (error) {
      console.error('🍎 Nutrition Service: Error deleting meal:', error);
      throw error;
    }
  },

  async searchFoods(query: string): Promise<FoodItem[]> {
    try {
      console.log('🍎 Nutrition Service: Searching foods...', query);
      const response = await apiClient.get('/health/foods/search', {
        params: { q: query }
      });
      console.log('🍎 Nutrition Service: Search results:', response.data);
      return response.data;
    } catch (error) {
      console.error('🍎 Nutrition Service: Error searching foods:', error);
      throw error;
    }
  },

  async getFoodById(id: number): Promise<FoodItem> {
    try {
      console.log('🍎 Nutrition Service: Fetching food by ID...', id);
      const response = await apiClient.get(`/health/foods/${id}`);
      console.log('🍎 Nutrition Service: Food received:', response.data);
      return response.data;
    } catch (error) {
      console.error('🍎 Nutrition Service: Error fetching food:', error);
      throw error;
    }
  },

  async getFoodByBarcode(barcode: string): Promise<FoodItem> {
    try {
      console.log('🍎 Nutrition Service: Fetching food by barcode...', barcode);
      const response = await apiClient.get('/health/foods/barcode', {
        params: { barcode }
      });
      console.log('🍎 Nutrition Service: Food received:', response.data);
      return response.data;
    } catch (error) {
      console.error('🍎 Nutrition Service: Error fetching food by barcode:', error);
      throw error;
    }
  },

  async getNutritionStats(period: string = 'week'): Promise<NutritionStats> {
    try {
      console.log('🍎 Nutrition Service: Fetching nutrition stats...', period);
      const response = await apiClient.get('/health/logging/nutrition/stats', {
        params: { period }
      });
      console.log('🍎 Nutrition Service: Stats received:', response.data);
      return response.data;
    } catch (error) {
      console.error('🍎 Nutrition Service: Error fetching stats:', error);
      throw error;
    }
  },

  async getMealPlans(): Promise<MealPlan[]> {
    try {
      console.log('🍎 Nutrition Service: Fetching meal plans...');
      const response = await apiClient.get('/health/nutrition-routines');
      console.log('🍎 Nutrition Service: Meal plans received:', response.data);
      return response.data;
    } catch (error) {
      console.error('🍎 Nutrition Service: Error fetching meal plans:', error);
      throw error;
    }
  }
};