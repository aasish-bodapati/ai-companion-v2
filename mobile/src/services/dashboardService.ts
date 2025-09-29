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
      throw error;
    }
  },

  async getQuickStats(): Promise<QuickStats> {
    try {
      const response = await apiClient.get('/health/dashboard/quick-stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch quick stats:', error);
      throw error;
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
