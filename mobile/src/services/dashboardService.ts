import { apiClient } from './api';

export interface TodayStats {
  workouts: number;
  meals: number;
  water_ml: number;
  total_minutes: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  calories_consumed?: number;
}

export interface WeeklyProgress {
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
}

export interface ActiveRoutine {
  id: string;
  name: string;
  type: 'fitness' | 'nutrition';
  difficulty: string;
  duration_weeks: number;
  description?: string;
  icon: string;
}

export interface SmartSuggestion {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  action: string;
  action_data: Record<string, unknown>;
  icon: string;
}

export interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  action: string;
  target: string;
}

export interface DashboardSummary {
  today_stats: TodayStats;
  weekly_progress: WeeklyProgress;
  active_routines: ActiveRoutine[];
  smart_suggestions: SmartSuggestion[];
  quick_actions: QuickAction[];
  streak: number;
  last_updated: string;
  cache_duration: number;
}

export interface QuickStats {
  workouts_today: number;
  meals_today: number;
  last_updated: string;
  total_workouts?: number;
  total_meals?: number;
  current_streak?: number;
  weekly_goal_progress?: number;
}

export const dashboardService = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const response = await apiClient.get('/health/dashboard/summary');
      return response.data;
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw error;
    }
  },

  async getQuickStats(): Promise<QuickStats> {
    try {
      const response = await apiClient.get('/health/dashboard/quick-stats');
      return response.data;
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw error;
    }
  },

  async getAnalyticsData(): Promise<Record<string, unknown>> {
    try {
      const response = await apiClient.get('/health/logging/analytics/daily');
      return response.data;
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw error;
    }
  }
};