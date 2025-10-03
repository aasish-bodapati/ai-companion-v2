import { apiClient } from './api';
import { BaseService } from './BaseService';
import { getTodayLocal } from '../utils/dateUtils';

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
  id: number | string;
  name: string;
  brand?: string;
  category: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  serving_size_g: number;
  serving_qty: number;
  serving_unit: string;
  serving_weight_g: number;
  photo?: string;
  type?: string;
  barcode?: string;
  // Serving nutrition data
  calories_per_serving?: number;
  protein_per_serving?: number;
  carbs_per_serving?: number;
  fat_per_serving?: number;
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
  // Additional properties used in NutritionScreen
  total_meals?: number;
  average_daily_calories?: number;
  macro_breakdown?: {
    protein: number;
    carbs: number;
    fat: number;
  };
  weekly_goal_progress?: number;
  streak?: number;
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

// Nutritionix API removed - using Indian food database instead

class NutritionService extends BaseService {
  async getNutritionLogs(params?: {
    period?: string;
    page?: number;
    size?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<NutritionLog[]> {
    console.log('🍽️ [NUTRITION SERVICE] getNutritionLogs called with params:', params);
    
    // Get timezone offset in minutes
    const timezoneOffset = new Date().getTimezoneOffset() * -1; // Convert to positive offset
    console.log('🍽️ [NUTRITION SERVICE] Timezone offset:', timezoneOffset);
    
    // Add timezone offset to params
    const paramsWithTimezone = {
      ...this.getPaginationParams(params),
      timezone_offset: timezoneOffset
    };
    console.log('🍽️ [NUTRITION SERVICE] Params with timezone:', paramsWithTimezone);
    
    return this.makeRequest(
      () => apiClient.get('/health/logging/nutrition/test', { params: paramsWithTimezone }),
      'NUTRITION SERVICE - getNutritionLogs'
    ).then(data => {
      console.log('🍽️ [NUTRITION SERVICE] Extracted logs:', data);
      console.log('🍽️ [NUTRITION SERVICE] Number of logs:', data.length);
      return data;
    });
  }

  async getRecentMeals(limit: number = 5): Promise<NutritionLog[]> {
    return this.makeRequest(
      () => apiClient.get('/health/logging/nutrition', {
        params: { size: limit, page: 1 }
      }),
      'NUTRITION SERVICE - getRecentMeals'
    ).then(data => {
      const meals = data?.meals || data || [];
      if (!Array.isArray(meals)) {
        // Silent warning handling - no console logging to prevent Expo Go notifications
        return [];
      }
      return meals;
    });
  }

  async getTodayNutritionSummary(): Promise<NutritionStats> {
    try {
      const today = getTodayLocal();
      console.log('🍽️ [NUTRITION SERVICE] Today (local):', today);
      
      const logs = await this.getNutritionLogs({ 
        start_date: today, 
        end_date: today 
      });
      
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
      this.handleError(error, 'NUTRITION SERVICE - getTodayNutritionSummary');
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
  }

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
  }): Promise<{status: string, id: number}> {
    return this.makeRequest(
      () => apiClient.post('/health/logging/nutrition/test', mealData),
      'NUTRITION SERVICE - logMeal'
    );
  }

  async updateMeal(id: string, mealData: Partial<NutritionLog>): Promise<NutritionLog> {
    return this.makeRequest(
      () => apiClient.put(`/health/logging/nutrition/${id}`, mealData),
      'NUTRITION SERVICE - updateMeal'
    );
  }

  async deleteMeal(id: string): Promise<void> {
    return this.makeRequest(
      () => apiClient.delete(`/health/logging/nutrition/${id}`),
      'NUTRITION SERVICE - deleteMeal'
    );
  }

  async searchFoods(query: string): Promise<FoodItem[]> {
    console.log('🔍 [NUTRITION SERVICE] Searching for:', query);
    
    const response = await this.makeRequest(
      () => apiClient.get('/health/indian-foods/search', {
        params: { q: query }
      }),
      'NUTRITION SERVICE - searchFoods'
    );
    
    console.log('🔍 [NUTRITION SERVICE] Raw response:', JSON.stringify(response, null, 2));
    
    // Transform API response to match FoodItem interface
    // The API returns the data array directly
    if (response && Array.isArray(response)) {
      console.log('🔍 [NUTRITION SERVICE] Found data array with', response.length, 'items');
      const transformed = response.map((item: any) => ({
        id: item.food_code,
        name: item.food_name,
        brand: '',
        category: 'Indian Food',
        calories_per_100g: item.energy_kcal || 0,
        protein_per_100g: item.protein_g || 0,
        carbs_per_100g: item.carbs_g || 0,
        fat_per_100g: item.fat_g || 0,
        fiber_g: item.fiber_g || 0,
        sugar_g: item.sugar_g || 0,
        sodium_mg: 0, // Not available in current API
        serving_size_g: 100,
        serving_qty: 1,
        serving_unit: item.serving_unit || 'serving',
        serving_weight_g: 100,
        type: 'indian_food',
        // Add serving nutrition data
        calories_per_serving: item.nutrition_per_serving?.energy_kcal || 0,
        protein_per_serving: item.nutrition_per_serving?.protein_g || 0,
        carbs_per_serving: item.nutrition_per_serving?.carbs_g || 0,
        fat_per_serving: item.nutrition_per_serving?.fat_g || 0,
      }));
      console.log('🔍 [NUTRITION SERVICE] Transformed results:', transformed);
      return transformed;
    }
    
    console.log('🔍 [NUTRITION SERVICE] No valid data found, returning empty array');
    return [];
  }

  async getFoodById(id: number): Promise<FoodItem> {
    return this.makeRequest(
      () => apiClient.get(`/health/foods/${id}`),
      'NUTRITION SERVICE - getFoodById'
    );
  }

  async getFoodByBarcode(barcode: string): Promise<FoodItem> {
    return this.makeRequest(
      () => apiClient.get('/health/foods/barcode', {
        params: { barcode }
      }),
      'NUTRITION SERVICE - getFoodByBarcode'
    );
  }

  async getNutritionStats(period: string = 'week'): Promise<NutritionStats> {
    return this.makeRequest(
      () => apiClient.get('/health/nutrition-logs/stats', {
        params: { period }
      }),
      'NUTRITION SERVICE - getNutritionStats'
    );
  }

  async getMealPlans(): Promise<MealPlan[]> {
    return this.makeRequest(
      () => apiClient.get('/health/nutrition-routines'),
      'NUTRITION SERVICE - getMealPlans'
    );
  }

  // Nutritionix API methods removed - using Indian food database instead

  async updateFoodItemQuantity(foodItemId: number, quantityGrams: number): Promise<void> {
    return this.makeRequest(
      () => apiClient.put(`/health/logging/food-items/${foodItemId}`, {
        quantity_grams: quantityGrams
      }),
      'NUTRITION SERVICE - updateFoodItemQuantity'
    );
  }
}

// Export singleton instance to maintain backward compatibility
export const nutritionService = new NutritionService();