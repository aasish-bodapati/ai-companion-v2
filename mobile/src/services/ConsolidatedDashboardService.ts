/**
 * Consolidated Dashboard Service
 * 
 * Combines:
 * - DashboardService (dashboard data)
 * - HealthDataService (health data aggregation)
 */

import { api } from './api';
import { DebugUtils } from '../utils/debugUtils';

// ===== TYPES =====

export interface DashboardSummary {
  user: {
    name: string;
    email: string;
    avatar_url?: string;
  };
  health_metrics: {
    bmi: number;
    weight: number;
    height: number;
    body_fat_percentage?: number;
    muscle_mass?: number;
  };
  today_stats: {
    workouts_completed: number;
    calories_consumed: number;
    water_intake_ml: number;
    steps: number;
    mood_rating: number;
  };
  weekly_progress: {
    workouts_this_week: number;
    average_daily_calories: number;
    average_daily_water: number;
    average_daily_steps: number;
    average_mood_rating: number;
  };
  goals_progress: {
    fitness_goals_completed: number;
    nutrition_goals_completed: number;
    health_goals_completed: number;
    overall_progress_percentage: number;
  };
  recent_activities: Array<{
    id: string;
    type: 'workout' | 'meal' | 'water' | 'mood' | 'steps';
    description: string;
    timestamp: string;
    value?: number;
    unit?: string;
  }>;
  insights: string[];
  recommendations: string[];
}

export interface QuickStats {
  today_workouts: number;
  today_calories: number;
  today_water_ml: number;
  today_steps: number;
  today_mood: number;
  weekly_workouts: number;
  weekly_calories: number;
  weekly_water_ml: number;
  weekly_steps: number;
  weekly_mood: number;
  current_streak?: number;
  weekly_goal_progress?: number;
}

export interface HealthDataSummary {
  user: Record<string, unknown>;
  health_metrics: Record<string, unknown>;
  today_stats: Record<string, unknown>;
  weekly_progress: Record<string, unknown>;
  goals_progress: Record<string, unknown>;
  recent_activities: Record<string, unknown>[];
  insights: string[];
  recommendations: string[];
  notifications: Record<string, unknown>;
}

// ===== CONSOLIDATED DASHBOARD SERVICE =====

class ConsolidatedDashboardService {
  // ===== DASHBOARD DATA =====

  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const response = await api.get('/api/v1/health/dashboard/summary');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch dashboard summary:', error);
      throw error;
    }
  }

  async getQuickStats(): Promise<QuickStats> {
    try {
      const response = await api.get('/api/v1/health/dashboard/quick-stats');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch quick stats:', error);
      throw error;
    }
  }

  async getHealthDataSummary(): Promise<HealthDataSummary> {
    try {
      const response = await api.get('/api/v1/health/dashboard/health-data');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch health data summary:', error);
      throw error;
    }
  }

  // ===== DASHBOARD WIDGETS =====

  async getTodayWidget(): Promise<{
    workouts: number;
    calories: number;
    water: number;
    steps: number;
    mood: number;
    goals_completed: number;
  }> {
    try {
      const response = await api.get('/api/v1/health/dashboard/today-widget');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch today widget:', error);
      throw error;
    }
  }

  async getWeeklyWidget(): Promise<{
    workouts: number;
    calories: number;
    water: number;
    steps: number;
    mood: number;
    goals_completed: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    try {
      const response = await api.get('/api/v1/health/dashboard/weekly-widget');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch weekly widget:', error);
      throw error;
    }
  }

  async getGoalsWidget(): Promise<{
    total_goals: number;
    completed_goals: number;
    progress_percentage: number;
    upcoming_deadlines: Array<{
      goal_name: string;
      days_remaining: number;
    }>;
  }> {
    try {
      const response = await api.get('/api/v1/health/dashboard/goals-widget');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch goals widget:', error);
      throw error;
    }
  }

  // ===== RECENT ACTIVITIES =====

  async getRecentActivities(limit: number = 10): Promise<Array<{
    id: string;
    type: 'workout' | 'meal' | 'water' | 'mood' | 'steps';
    description: string;
    timestamp: string;
    value?: number;
    unit?: string;
    icon?: string;
  }>> {
    try {
      const response = await api.get('/api/v1/health/dashboard/recent-activities', {
        params: { limit }
      });
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch recent activities:', error);
      throw error;
    }
  }

  // ===== INSIGHTS AND RECOMMENDATIONS =====

  async getInsights(): Promise<{
    health_insights: string[];
    fitness_insights: string[];
    nutrition_insights: string[];
    wellness_insights: string[];
    priority: 'high' | 'medium' | 'low';
  }> {
    try {
      const response = await api.get('/api/v1/health/dashboard/insights');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch insights:', error);
      throw error;
    }
  }

  async getRecommendations(): Promise<{
    fitness_recommendations: string[];
    nutrition_recommendations: string[];
    health_recommendations: string[];
    lifestyle_recommendations: string[];
    priority: 'high' | 'medium' | 'low';
  }> {
    try {
      const response = await api.get('/api/v1/health/dashboard/recommendations');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch recommendations:', error);
      throw error;
    }
  }

  // ===== DASHBOARD CUSTOMIZATION =====

  async getDashboardLayout(): Promise<{
    widgets: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      enabled: boolean;
    }>;
    theme: 'light' | 'dark' | 'auto';
  }> {
    try {
      const response = await api.get('/api/v1/health/dashboard/layout');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch dashboard layout:', error);
      throw error;
    }
  }

  async updateDashboardLayout(layout: {
    widgets: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      enabled: boolean;
    }>;
    theme?: 'light' | 'dark' | 'auto';
  }): Promise<void> {
    try {
      await api.put('/api/v1/health/dashboard/layout', layout);
      DebugUtils.log('Dashboard layout updated successfully');
    } catch (error) {
      DebugUtils.error('Failed to update dashboard layout:', error);
      throw error;
    }
  }

  // ===== DASHBOARD ANALYTICS =====

  async getDashboardAnalytics(period: 'week' | 'month' | 'quarter' = 'month'): Promise<{
    engagement_score: number;
    goal_completion_rate: number;
    activity_consistency: number;
    health_improvement_score: number;
    trends: {
      workouts: 'increasing' | 'decreasing' | 'stable';
      nutrition: 'improving' | 'declining' | 'stable';
      wellness: 'improving' | 'declining' | 'stable';
    };
    achievements: Array<{
      id: string;
      name: string;
      description: string;
      unlocked_at: string;
      icon?: string;
    }>;
  }> {
    try {
      const response = await api.get(`/api/v1/health/dashboard/analytics/${period}`);
      return response;
    } catch (error) {
      DebugUtils.error(`Failed to fetch ${period} dashboard analytics:`, error);
      throw error;
    }
  }

  // ===== DASHBOARD REFRESH =====

  async refreshDashboard(): Promise<DashboardSummary> {
    try {
      const response = await api.post('/api/v1/health/dashboard/refresh');
      DebugUtils.log('Dashboard refreshed successfully');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to refresh dashboard:', error);
      throw error;
    }
  }

  // ===== DASHBOARD EXPORT =====

  async exportDashboardData(format: 'json' | 'csv' | 'pdf' = 'json'): Promise<{
    data: any;
    format: string;
    exported_at: string;
  }> {
    try {
      const response = await api.get('/api/v1/health/dashboard/export', {
        params: { format }
      });
      return response;
    } catch (error) {
      DebugUtils.error(`Failed to export dashboard data as ${format}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const dashboardService = new ConsolidatedDashboardService();
export default dashboardService;
