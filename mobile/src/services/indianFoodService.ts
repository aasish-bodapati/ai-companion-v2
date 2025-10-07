/**
 * Indian Food Service
 * Handles Indian food database operations and nutrition calculations
 */

import { apiClient } from './api';

export interface IndianFood {
  food_code: string;
  food_name: string;
  primary_source?: string;
  energy_kcal?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  serving_unit?: string;
  nutrition_per_100g: {
    energy_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugar_g: number;
    sodium_mg: number;
    calcium_mg: number;
    iron_mg: number;
    vitc_mg: number;
  };
}

export interface IndianFoodNutrition {
  food_code: string;
  food_name: string;
  serving_qty: number;
  serving_unit: string;
  energy_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  calcium_mg: number;
  iron_mg: number;
  vitc_mg: number;
}

export interface MealNutrition {
  total_nutrition: {
    energy_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugar_g: number;
    sodium_mg: number;
    calcium_mg: number;
    iron_mg: number;
    vitc_mg: number;
  };
  food_items_count: number;
}

export interface FoodCategory {
  categories: Record<string, number>;
  total_categories: number;
}

class IndianFoodService {
  private baseUrl = '/health/indian-foods';

  /**
   * Search for Indian foods by name
   */
  async searchFoods(query: string, limit: number = 20): Promise<IndianFood[]> {
    try {
      console.log('🔍 Searching Indian foods:', { query, limit, url: `${this.baseUrl}/search` });
      
      const response = await apiClient.get(`${this.baseUrl}/search`, {
        params: { q: query, limit }
      });
      
      console.log('✅ Search response:', { status: response.status, dataLength: response.data?.data?.length });
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Search failed');
    } catch (error: any) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      if (error.response) {
        // Silent error handling - no console logging to prevent Expo Go notifications
        // Silent error handling - no console logging to prevent Expo Go notifications
      }
      throw error;
    }
  }

  /**
   * Get specific food by food code
   */
  async getFoodByCode(foodCode: string): Promise<IndianFood> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/food/${foodCode}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Food not found');
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw error;
    }
  }

  /**
   * Get nutrition data for a specific food and serving quantity
   */
  async getFoodNutrition(foodCode: string, servingQty: number = 1.0): Promise<IndianFoodNutrition> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/nutrition/${foodCode}`, {
        params: { serving_qty: servingQty }
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Nutrition data not found');
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw error;
    }
  }

  /**
   * Get popular Indian foods
   */
  async getPopularFoods(limit: number = 20): Promise<IndianFood[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/popular`, {
        params: { limit }
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to get popular foods');
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw error;
    }
  }

  /**
   * Get foods by category keywords
   */
  async getFoodsByCategory(keywords: string[], limit: number = 20): Promise<IndianFood[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/category`, {
        params: { 
          keywords: keywords.join(','), 
          limit 
        }
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to get foods by category');
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw error;
    }
  }

  /**
   * Calculate total nutrition for a meal with multiple food items
   */
  async calculateMealNutrition(foodItems: {
    food_code: string;
    serving_qty: number;
  }[]): Promise<MealNutrition> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/calculate-meal`, foodItems);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to calculate meal nutrition');
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw error;
    }
  }

  /**
   * Get available food categories
   */
  async getFoodCategories(): Promise<FoodCategory> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/categories`);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to get categories');
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw error;
    }
  }

  /**
   * Search foods with debouncing for better UX
   */
  private searchTimeout: NodeJS.Timeout | null = null;
  
  async searchFoodsDebounced(query: string, limit: number = 20, delay: number = 300): Promise<IndianFood[]> {
    return new Promise((resolve, reject) => {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      
      this.searchTimeout = setTimeout(async () => {
        try {
          const results = await this.searchFoods(query, limit);
          resolve(results);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }

  /**
   * Get common Indian food categories for quick access
   */
  getCommonCategories(): string[] {
    return [
      'curry',
      'rice',
      'dal',
      'bread',
      'vegetable',
      'snack',
      'sweet',
      'drink'
    ];
  }

  /**
   * Format food name for display
   */
  formatFoodName(food: IndianFood): string {
    return food.food_name || 'Unknown Food';
  }

  /**
   * Get serving size display text
   */
  getServingDisplay(food: IndianFood, qty: number = 1): string {
    const unit = food.serving_unit || '100g';
    return `${qty} ${unit}`;
  }

  /**
   * Calculate nutrition for custom serving size
   */
  calculateCustomNutrition(food: IndianFood, customQty: number, customUnit: string = 'g'): IndianFoodNutrition {
    const baseNutrition = food.nutrition_per_100g;
    const multiplier = customQty / 100; // Assuming custom unit is in grams
    
    return {
      food_code: food.food_code,
      food_name: food.food_name,
      serving_qty: customQty,
      serving_unit: customUnit,
      energy_kcal: Math.round(baseNutrition.energy_kcal * multiplier * 100) / 100,
      protein_g: Math.round(baseNutrition.protein_g * multiplier * 100) / 100,
      carbs_g: Math.round(baseNutrition.carbs_g * multiplier * 100) / 100,
      fat_g: Math.round(baseNutrition.fat_g * multiplier * 100) / 100,
      fiber_g: Math.round(baseNutrition.fiber_g * multiplier * 100) / 100,
      sugar_g: Math.round(baseNutrition.sugar_g * multiplier * 100) / 100,
      sodium_mg: Math.round(baseNutrition.sodium_mg * multiplier * 100) / 100,
      calcium_mg: Math.round(baseNutrition.calcium_mg * multiplier * 100) / 100,
      iron_mg: Math.round(baseNutrition.iron_mg * multiplier * 100) / 100,
      vitc_mg: Math.round(baseNutrition.vitc_mg * multiplier * 100) / 100,
    };
  }
}

export const indianFoodService = new IndianFoodService();
export default indianFoodService;
