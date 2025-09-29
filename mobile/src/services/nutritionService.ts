import { apiClient } from './api';

export interface FoodItem {
  id: number;
  name: string;
  brand?: string;
  barcode?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
  sugar_per_100g?: number;
  sodium_per_100g?: number;
  category: string;
  description?: string;
  source?: string;
  is_favorite?: boolean;
  last_used?: string;
}

export interface MealLog {
  id: number;
  food_id: number;
  food_name: string;
  quantity: number;
  unit: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  logged_at: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
}

export interface NutritionStats {
  total_meals: number;
  total_calories: number;
  average_daily_calories: number;
  macro_breakdown: {
    protein: number;
    carbs: number;
    fat: number;
  };
  streak: number;
  weekly_goal_progress: number;
}

export interface NutritionGoal {
  id: number;
  title: string;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  is_active: boolean;
  created_at: string;
  deadline?: string;
}

export const nutritionService = {
  // Food Search and Management
  async searchFoods(query: string, limit: number = 20) {
    try {
      const response = await apiClient.get(`/health/foods/public-search?query=${encodeURIComponent(query)}&limit=${limit}`);
      return { foods: response.data };
    } catch (error) {
      console.error('Failed to search foods:', error);
      throw error;
    }
  },

  async getFoodById(foodId: string) {
    try {
      const response = await apiClient.get(`/health/foods/nutrition/${foodId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get food details:', error);
      throw error;
    }
  },

  async searchByBarcode(barcode: string) {
    try {
      const response = await apiClient.get(`/health/foods/barcode/${barcode}`);
      return response.data;
    } catch (error) {
      console.error('Failed to search by barcode:', error);
      throw error;
    }
  },

  async getPopularFoods() {
    try {
      const response = await apiClient.get('/health/foods/popular');
      return response.data;
    } catch (error) {
      console.error('Failed to get popular foods:', error);
      throw error;
    }
  },

  async getRecentFoods() {
    try {
      const response = await apiClient.get('/health/foods/recent');
      return response.data;
    } catch (error) {
      console.error('Failed to get recent foods:', error);
      throw error;
    }
  },

  async getFavoriteFoods() {
    try {
      const response = await apiClient.get('/health/foods/favorites');
      return response.data;
    } catch (error) {
      console.error('Failed to get favorite foods:', error);
      throw error;
    }
  },

  // Meal Logging
  async logMeal(mealData: {
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    total_calories: number;
    food_items: Array<{
      food_id: number;
      food_name: string;
      quantity_grams: number;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
    }>;
    meal_date?: string;
  }) {
    try {
      const response = await apiClient.post('/health/nutrition-logs/', mealData);
      return response.data;
    } catch (error) {
      console.error('Failed to log meal:', error);
      throw error;
    }
  },

  async getMealLogs(params?: {
    period?: 'week' | 'month' | 'all';
    page?: number;
    size?: number;
    meal_type?: string;
  }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.period) queryParams.append('period', params.period);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.size) queryParams.append('size', params.size.toString());
      if (params?.meal_type) queryParams.append('meal_type', params.meal_type);

      const response = await apiClient.get(`/health/nutrition-logs/?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get meal logs:', error);
      throw error;
    }
  },

  async updateMealLog(logId: number, updateData: {
    quantity?: number;
    unit?: string;
    meal_type?: string;
    notes?: string;
  }) {
    try {
      const response = await apiClient.put(`/health/nutrition-logs/${logId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Failed to update meal log:', error);
      throw error;
    }
  },

  async deleteMealLog(logId: number) {
    try {
      await apiClient.delete(`/health/nutrition-logs/${logId}`);
    } catch (error) {
      console.error('Failed to delete meal log:', error);
      throw error;
    }
  },

  // Statistics and Analytics
  async getNutritionStats(period: 'week' | 'month' | 'all' = 'week') {
    try {
      // Use the working nutrition logs endpoint and transform the data
      const response = await apiClient.get('/health/nutrition-logs/');
      const data = response.data;
      const stats = data.stats || {};
      
      // Transform backend response to match frontend interface
      return {
        total_meals: stats.totalMeals || 0,
        total_calories: stats.totalCalories || 0,
        average_daily_calories: stats.avgCaloriesPerMeal || 0,
        macro_breakdown: {
          protein: stats.totalProtein || 0,
          carbs: stats.totalCarbs || 0,
          fat: stats.totalFat || 0,
        },
        streak: stats.currentStreak || 0,
        weekly_goal_progress: 0, // Not available in current data
      };
    } catch (error) {
      console.error('Failed to get nutrition stats:', error);
      throw error;
    }
  },

  async getTodayNutrition() {
    try {
      const response = await apiClient.get('/health/logging/nutrition/today');
      return response.data;
    } catch (error) {
      console.error('Failed to get today\'s nutrition:', error);
      throw error;
    }
  },

  async getWeeklyNutrition() {
    try {
      const response = await apiClient.get('/health/logging/nutrition/weekly');
      return response.data;
    } catch (error) {
      console.error('Failed to get weekly nutrition:', error);
      throw error;
    }
  },

  // Get weekly nutrition activity data for chart
  async getWeeklyNutritionActivityData(): Promise<{
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  }> {
    try {
      const response = await apiClient.get('/health/nutrition-logs/');
      const data = response.data;
      const logs = data.logs || [];
      
      // Initialize weekly data
      const weeklyData = {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0,
      };
      
      // Process each log
      logs.forEach((log: any, index: number) => {
        const date = new Date(log.logged_at || log.created_at);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Convert to our format (Monday = 0, Sunday = 6)
        const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        if (dayKeys[dayIndex]) {
          weeklyData[dayKeys[dayIndex] as keyof typeof weeklyData]++;
          console.log(`🍎 Log ${index + 1}: ${log.logged_at || log.created_at} -> ${dayKeys[dayIndex]} (getDay: ${dayOfWeek}, dayIndex: ${dayIndex})`);
        }
      });
      
      return weeklyData;
    } catch (error) {
      console.error('Failed to fetch weekly nutrition activity data:', error);
      // Return empty data on error
      return {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0,
      };
    }
  },

  // Goals Management
  async getNutritionGoals() {
    try {
      const response = await apiClient.get('/health/simple-goals/goals');
      return response.data;
    } catch (error) {
      console.error('Failed to get nutrition goals:', error);
      throw error;
    }
  },

  async createNutritionGoal(goalData: {
    title: string;
    target_calories: number;
    target_protein?: number;
    target_carbs?: number;
    target_fat?: number;
    deadline?: string;
  }) {
    try {
      const response = await apiClient.post('/health/simple-goals/goals', {
        ...goalData,
        goal_type: 'nutrition'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create nutrition goal:', error);
      throw error;
    }
  },

  async updateNutritionGoal(goalId: string, updateData: {
    title?: string;
    target_calories?: number;
    target_protein?: number;
    target_carbs?: number;
    target_fat?: number;
    deadline?: string;
  }) {
    try {
      const response = await apiClient.put(`/health/simple-goals/goals/${goalId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Failed to update nutrition goal:', error);
      throw error;
    }
  },

  async deleteNutritionGoal(goalId: string) {
    try {
      await apiClient.delete(`/health/simple-goals/goals/${goalId}`);
    } catch (error) {
      console.error('Failed to delete nutrition goal:', error);
      throw error;
    }
  }
};
