import api from '@/lib/api';
import { logger } from '@/lib/logger';

export interface Food {
  id: string;
  name: string;
  brand?: string;
  category: string;
  calories_per_100g: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  fiber_per_100g?: number;
  sugar_per_100g?: number;
  sodium_per_100g?: number;
  common_serving_sizes?: Array<{name: string; grams: number}>;
  user_times_logged?: number;
  user_avg_serving_grams?: number;
}

export interface FoodItem {
  food: Food;
  serving_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface MealData {
  // Step 1: Meal Type & Time
  meal_type: string;
  meal_name?: string;
  meal_time?: string;
  
  // Step 2: Food Selection
  food_items: FoodItem[];
  
  // Step 3: Nutritional Review
  total_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  
  // Step 4: Context & Notes
  routineId?: string;
  notes?: string;
  mood_before?: string;
  mood_after?: string;
}

export interface NutritionLogData {
  meal_type: string;
  meal_name?: string;
  total_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  food_items: string;
  food_ids: string[];
  routine_id?: string;
  notes?: string;
  mood_before?: string;
  mood_after?: string;
  meal_date: string;
  use_smart_defaults: boolean;
}

export interface FoodSuggestionsResponse {
  suggestions: Array<{ food: Food }>;
}

export interface FoodSearchResponse {
  foods: Food[];
}

class NutritionLoggerService {
  /**
   * Get food suggestions based on meal type
   */
  async getFoodSuggestions(mealType?: string, limit: number = 8): Promise<Food[]> {
    try {
      logger.debug('Loading food suggestions...', { mealType, limit });
      
      const params = new URLSearchParams();
      if (mealType) {
        params.append('meal_type', mealType);
      }
      params.append('limit', limit.toString());

      const response = await api.get(`/health/foods/suggestions?${params}`);
      const suggestions = response.suggestions?.map((s: any) => s.food) || [];
      
      logger.debug('Food suggestions loaded:', { count: suggestions.length });
      return suggestions;
    } catch (error) {
      logger.error('Failed to load food suggestions:', error);
      throw new Error('Failed to load food suggestions');
    }
  }

  /**
   * Search for foods by query using local database
   */
  async searchFoods(query: string, limit: number = 10): Promise<Food[]> {
    try {
      logger.debug('Searching foods with local database...', { query, limit });
      
      if (!query.trim()) {
        return [];
      }

      // Use public search endpoint (no authentication required for MVP)
      const response = await api.get(`/health/foods/public-search?query=${encodeURIComponent(query)}&limit=${limit}`);
      const foods = response || [];
      
      logger.debug('Food search completed:', { query, count: foods.length });
      return foods;
    } catch (error) {
      logger.error('Failed to search foods:', error);
      throw new Error('Failed to search foods');
    }
  }


  /**
   * Search for foods using only local database (fallback)
   */
  async searchFoodsLocal(query: string, limit: number = 10): Promise<Food[]> {
    try {
      logger.debug('Searching foods in local database...', { query, limit });
      
      if (!query.trim()) {
        return [];
      }

      const response = await api.get(`/health/foods/public-search?query=${encodeURIComponent(query)}&limit=${limit}`);
      const foods = response.foods || [];
      
      logger.debug('Local food search completed:', { query, count: foods.length });
      return foods;
    } catch (error) {
      logger.error('Failed to search local foods:', error);
      throw new Error('Failed to search local foods');
    }
  }

  /**
   * Log a meal using smart contextual logging
   */
  async logMeal(mealData: MealData, routineContext?: { id: string; name: string }): Promise<{ log_id: string }> {
    try {
      logger.debug('Logging meal...', { mealData, routineContext });
      
      const logData = {
        meal_type: mealData.meal_type,
        meal_name: mealData.meal_name,
        total_calories: Math.round(mealData.total_calories),
        notes: mealData.notes || undefined,
        meal_date: new Date().toISOString()
      };

      const response = await api.post('/health/logging/nutrition', logData);
      
      logger.debug('Meal logged successfully:', { response });
      return { log_id: response.id || response.log_id || 'success' };
    } catch (error) {
      logger.error('Failed to log meal:', error);
      throw new Error('Failed to log meal');
    }
  }

  /**
   * Get nutrition data for a food using local database
   */
  async getFoodNutrition(foodId: string, servingGrams: number = 100): Promise<{
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugar_g: number;
    sodium_mg: number;
    protein_percent: number;
    carbs_percent: number;
    fat_percent: number;
  }> {
    try {
      logger.debug('Getting food nutrition...', { foodId, servingGrams });
      
      const response = await api.get(`/health/foods/public-nutrition/${foodId}?serving_grams=${servingGrams}`);
      
      logger.debug('Food nutrition retrieved:', { foodId, nutrition: response });
      return response;
    } catch (error) {
      logger.error('Failed to get food nutrition:', error);
      throw new Error('Failed to get food nutrition');
    }
  }

  /**
   * Calculate nutrition totals from food items
   */
  calculateNutrition(foodItems: FoodItem[]): {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugar_g: number;
    sodium_mg: number;
  } {
    return foodItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein_g: acc.protein_g + item.protein_g,
        carbs_g: acc.carbs_g + item.carbs_g,
        fat_g: acc.fat_g + item.fat_g,
        fiber_g: acc.fiber_g + (item.food.fiber_per_100g || 0) * (item.serving_grams / 100),
        sugar_g: acc.sugar_g + (item.food.sugar_per_100g || 0) * (item.serving_grams / 100),
        sodium_mg: acc.sodium_mg + (item.food.sodium_per_100g || 0) * (item.serving_grams / 100)
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0 }
    );
  }

  /**
   * Create a food item from food and serving size
   */
  createFoodItem(food: Food, servingGrams: number = food.user_avg_serving_grams || 100): FoodItem {
    const multiplier = servingGrams / 100;
    return {
      food,
      serving_grams: servingGrams,
      calories: food.calories_per_100g * multiplier,
      protein_g: (food.protein_per_100g || 0) * multiplier,
      carbs_g: (food.carbs_per_100g || 0) * multiplier,
      fat_g: (food.fat_per_100g || 0) * multiplier
    };
  }

  /**
   * Get suggested meal type based on current time
   */
  getSuggestedMealType(): string {
    const currentHour = new Date().getHours();
    
    if (currentHour >= 6 && currentHour < 11) return 'breakfast';
    if (currentHour >= 11 && currentHour < 16) return 'lunch';
    if (currentHour >= 16 && currentHour < 22) return 'dinner';
    return 'snack';
  }

  /**
   * Get meal types with metadata
   */
  getMealTypes() {
    return [
      { 
        id: 'breakfast', 
        name: 'Breakfast', 
        icon: '🌅', 
        description: 'Start your day right',
        time: '6:00 - 11:00 AM'
      },
      { 
        id: 'lunch', 
        name: 'Lunch', 
        icon: '☀️', 
        description: 'Midday fuel',
        time: '11:00 AM - 4:00 PM'
      },
      { 
        id: 'dinner', 
        name: 'Dinner', 
        icon: '🌙', 
        description: 'Evening meal',
        time: '4:00 - 10:00 PM'
      },
      { 
        id: 'snack', 
        name: 'Snack', 
        icon: '🍎', 
        description: 'Quick bite',
        time: 'Anytime'
      }
    ];
  }

  /**
   * Get recent foods for quick access
   */
  async getRecentFoods(limit: number = 5): Promise<Food[]> {
    try {
      logger.debug('Loading recent foods...', { limit });
      
      const response = await api.get(`/health/foods/recent?limit=${limit}`);
      const foods = response.foods || [];
      
      logger.debug('Recent foods loaded:', { count: foods.length });
      return foods;
    } catch (error) {
      logger.error('Failed to load recent foods:', error);
      // Return empty array for now - this endpoint might not exist yet
      return [];
    }
  }

  /**
   * Get mood options
   */
  getMoodOptions() {
    return ['hungry', 'satisfied', 'full', 'craving', 'energetic', 'tired'];
  }
}

export const nutritionLoggerService = new NutritionLoggerService();
