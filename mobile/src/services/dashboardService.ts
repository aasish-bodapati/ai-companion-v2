import { apiClient } from './api';

export interface DashboardSummary {
  today_stats: {
    workouts: number;
    meals: number;
    calories_burned: number;
    calories_consumed: number;
    total_minutes: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    net_calories: number;
  };
  weekly_progress: {
    workouts_completed: number;
    workouts_target: number;
    workout_progress: number;
    meals_logged: number;
    meals_target: number;
    meal_progress: number;
    overall_progress: number;
    days_in_week: number;
    total_minutes_this_week: number;
    avg_calories_per_day: number;
  };
  active_routines: {
    id: number;
    name: string;
    type: 'fitness' | 'nutrition';
    difficulty: string;
    duration_weeks: number;
    description: string;
    icon: string;
    progress?: number;
    next_workout?: string;
  }[];
  smart_suggestions: {
    type: string;
    priority: string;
    title: string;
    message: string;
    action: string;
    action_data: any;
    icon: string;
  }[];
  quick_actions: {
    id: number;
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    action: string;
    target: string;
  }[];
  streak: number;
  last_updated: string;
  cache_duration: number;
}

export interface QuickStats {
  total_workouts: number;
  total_meals: number;
  current_streak: number;
  weekly_goal_progress: number;
  last_workout_date?: string;
  last_meal_date?: string;
}

export const dashboardService = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const response = await apiClient.get('/health/dashboard/summary');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard summary:', error);
      // Return fallback data instead of throwing error
      return {
        today_stats: {
          workouts: 0,
          meals: 0,
          calories_burned: 0,
          calories_consumed: 0,
          total_minutes: 0,
          protein_g: 0,
          carbs_g: 0,
          fat_g: 0,
          net_calories: 0,
        },
        weekly_progress: {
          workouts_completed: 0,
          workouts_target: 5,
          workout_progress: 0,
          meals_logged: 0,
          meals_target: 21,
          meal_progress: 0,
          overall_progress: 0,
          days_in_week: 7,
          total_minutes_this_week: 0,
          avg_calories_per_day: 0,
        },
        active_routines: [],
        smart_suggestions: [],
        quick_actions: [],
        streak: 0,
        last_updated: new Date().toISOString(),
        cache_duration: 60,
      };
    }
  },

  async getQuickStats(): Promise<QuickStats> {
    try {
      const response = await apiClient.get('/health/dashboard/quick-stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch quick stats:', error);
      // Return fallback data instead of throwing error
      return {
        total_workouts: 0,
        total_meals: 0,
        current_streak: 0,
        weekly_goal_progress: 0,
      };
    }
  },

  async getFitnessStats(period: 'week' | 'month' | 'all' = 'week') {
    try {
      const response = await apiClient.get(`/health/fitness-logs/stats?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch fitness stats:', error);
      throw error;
    }
  },

  async getNutritionStats(period: 'week' | 'month' | 'all' = 'week') {
    try {
      const response = await apiClient.get(`/health/nutrition-logs/stats?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch nutrition stats:', error);
      throw error;
    }
  },

  async getRecentActivity(limit: number = 10) {
    try {
      const response = await apiClient.get(`/health/logging/analytics/daily-summary?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
      throw error;
    }
  },

  async getHealthInsights() {
    try {
      const response = await apiClient.get('/health/insights/suggestions');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch health insights:', error);
      throw error;
    }
  },

  async getGoalsProgress() {
    try {
      const response = await apiClient.get('/health/simple-goals/goals/summary');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch goals progress:', error);
      throw error;
    }
  }
};
