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
   * Search for foods by query
   */
  async searchFoods(query: string, limit: number = 10): Promise<Food[]> {
    try {
      logger.debug('Searching foods...', { query, limit });
      
      if (!query.trim()) {
        return [];
      }

      const response = await api.get(`/health/foods/search?query=${encodeURIComponent(query)}&limit=${limit}`);
      const foods = response.foods || [];
      
      logger.debug('Food search completed:', { query, count: foods.length });
      return foods;
    } catch (error) {
      logger.error('Failed to search foods:', error);
      throw new Error('Failed to search foods');
    }
  }

  /**
   * Log a meal using smart contextual logging
   */
  async logMeal(mealData: MealData, routineContext?: { id: string; name: string }): Promise<{ log_id: string }> {
    try {
      logger.debug('Logging meal...', { mealData, routineContext });
      
      const logData: NutritionLogData = {
        meal_type: mealData.meal_type,
        meal_name: mealData.meal_name,
        total_calories: Math.round(mealData.total_calories),
        protein_g: Math.round(mealData.protein_g * 10) / 10,
        carbs_g: Math.round(mealData.carbs_g * 10) / 10,
        fat_g: Math.round(mealData.fat_g * 10) / 10,
        fiber_g: Math.round(mealData.fiber_g * 10) / 10,
        sugar_g: Math.round(mealData.sugar_g * 10) / 10,
        sodium_mg: Math.round(mealData.sodium_mg),
        food_items: JSON.stringify(mealData.food_items.map(item => ({
          name: item.food.name,
          brand: item.food.brand,
          serving_grams: item.serving_grams,
          calories: item.calories,
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fat_g: item.fat_g
        }))),
        food_ids: mealData.food_items.map(item => item.food.id),
        routine_id: mealData.routineId || routineContext?.id,
        notes: mealData.notes,
        mood_before: mealData.mood_before,
        mood_after: mealData.mood_after,
        meal_date: new Date().toISOString(),
        use_smart_defaults: true
      };

      const response = await api.post('/health/contextual-logging/meal/smart', logData);
      
      logger.debug('Meal logged successfully:', { logId: response.log_id });
      return response;
    } catch (error) {
      logger.error('Failed to log meal:', error);
      throw new Error('Failed to log meal');
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
   * Get mood options
   */
  getMoodOptions() {
    return ['hungry', 'satisfied', 'full', 'craving', 'energetic', 'tired'];
  }
}

export const nutritionLoggerService = new NutritionLoggerService();
