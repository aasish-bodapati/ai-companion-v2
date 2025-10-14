/**
 * Consolidated Health Service
 * 
 * Combines:
 * - HealthService (health data management)
 * - HealthDataService (health data aggregation)
 * - MoodService (mood tracking)
 * - StepTrackingService (step counting)
 * - SimpleWaterService (water intake)
 */

import { api } from './api';
import { DebugUtils } from '../utils/debugUtils';

// ===== TYPES =====

export interface HealthData {
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  activity_level: 'sedentary' | 'light' | 'active' | 'very_active';
  bmi?: number;
  bmr?: number;
  tdee?: number;
  body_fat_percentage?: number;
  muscle_mass?: number;
  last_updated: string;
}

export interface WaterStats {
  total_ml_today: number;
  total_oz_today: number;
  goal_ml: number;
  goal_oz: number;
  progress_percentage: number;
  logs_today: number;
}

export interface MoodLog {
  id: string;
  mood_rating: number; // 1-10 scale
  energy_level?: number; // 1-10 scale
  activities?: string[];
  notes?: string;
  logged_at: string;
}

export interface MoodStats {
  total_logs: number;
  average_mood: number;
  mood_trend: 'increasing' | 'decreasing' | 'stable';
  recent_logs: MoodLog[];
  mood_distribution: {
    rating: number;
    count: number;
  }[];
}

export interface StepData {
  date: string;
  steps: number;
  distance_km: number;
  calories_burned: number;
  active_minutes: number;
}

export interface HealthSummary {
  user: HealthData;
  water: WaterStats;
  mood: {
    today_rating: number;
    weekly_average: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  steps: {
    today: number;
    weekly_average: number;
    goal: number;
    progress_percentage: number;
  };
  notifications: {
    water_reminder: boolean;
    mood_check: boolean;
    step_goal: boolean;
    health_insights: string[];
  };
}

export interface HealthInsights {
  bmi_category: 'underweight' | 'normal' | 'overweight' | 'obese';
  bmi_interpretation: string;
  activity_recommendation: string;
  nutrition_recommendation: string;
  water_recommendation: string;
  mood_recommendation: string;
  overall_health_score: number; // 1-100
}

// ===== CONSOLIDATED HEALTH SERVICE =====

class ConsolidatedHealthService {
  // ===== HEALTH DATA MANAGEMENT =====

  async getHealthData(): Promise<HealthData> {
    try {
      const response = await api.get('/api/v1/health/profile');
      return response.health_data;
    } catch (error) {
      DebugUtils.error('Failed to fetch health data:', error);
      throw error;
    }
  }

  async updateHealthData(healthData: Partial<HealthData>): Promise<HealthData> {
    try {
      const response = await api.put('/api/v1/health/profile', { health_data: healthData });
      DebugUtils.log('Health data updated successfully:', response);
      return response.health_data;
    } catch (error) {
      DebugUtils.error('Failed to update health data:', error);
      throw error;
    }
  }

  async calculateHealthMetrics(healthData: HealthData): Promise<{
    bmi: number;
    bmr: number;
    tdee: number;
    body_fat_percentage: number;
    muscle_mass: number;
  }> {
    try {
      const response = await api.post('/api/v1/health/calculate-metrics', healthData);
      return response;
    } catch (error) {
      DebugUtils.error('Failed to calculate health metrics:', error);
      throw error;
    }
  }

  // ===== WATER TRACKING =====

  async logWater(amount_ml: number): Promise<WaterStats> {
    try {
      const response = await api.post('/api/v1/health/logging/water/quick', null, {
        params: { amount_ml }
      });
      DebugUtils.log('Water logged successfully:', response);
      return this.getWaterStats();
    } catch (error) {
      DebugUtils.error('Failed to log water:', error);
      throw error;
    }
  }

  async getWaterStats(): Promise<WaterStats> {
    try {
      const response = await api.get('/api/v1/health/logging/water/today');
      return {
        total_ml_today: response.total_ml,
        total_oz_today: response.total_oz,
        goal_ml: response.goal_ml,
        goal_oz: response.goal_ml * 0.033814,
        progress_percentage: response.progress_percentage,
        logs_today: response.logs_count,
      };
    } catch (error) {
      DebugUtils.error('Failed to fetch water stats:', error);
      throw error;
    }
  }

  async setWaterGoal(goal_ml: number): Promise<void> {
    try {
      await api.put('/api/v1/health/logging/water/goal', { goal_ml });
      DebugUtils.log('Water goal updated successfully');
    } catch (error) {
      DebugUtils.error('Failed to set water goal:', error);
      throw error;
    }
  }

  // ===== MOOD TRACKING =====

  async logMood(moodData: {
    mood_rating: number;
    energy_level?: number;
    activities?: string[];
    notes?: string;
  }): Promise<MoodLog> {
    try {
      const response = await api.post('/api/v1/health/logging/mood', moodData);
      DebugUtils.log('Mood logged successfully:', response);
      return response;
    } catch (error) {
      DebugUtils.error('Failed to log mood:', error);
      throw error;
    }
  }

  async getMoodLogs(period: 'week' | 'month' = 'week'): Promise<MoodLog[]> {
    try {
      const response = await api.get(`/api/v1/health/logging/mood/${period}`);
      return response;
    } catch (error) {
      DebugUtils.error(`Failed to fetch ${period} mood logs:`, error);
      throw error;
    }
  }

  async getMoodInsights(): Promise<{
    average_rating: number;
    trend: 'improving' | 'declining' | 'stable';
    recommendations: string[];
    weekly_pattern: Array<{
      day: string;
      average_rating: number;
    }>;
  }> {
    try {
      const response = await api.get('/api/v1/health/logging/mood/insights');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch mood insights:', error);
      throw error;
    }
  }

  // ===== STEP TRACKING =====

  async getStepData(date?: string): Promise<StepData> {
    try {
      const params = date ? { date } : {};
      const response = await api.get('/api/v1/health/logging/steps', { params });
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch step data:', error);
      throw error;
    }
  }

  async getWeeklyStepData(): Promise<StepData[]> {
    try {
      const response = await api.get('/api/v1/health/logging/steps/week');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch weekly step data:', error);
      throw error;
    }
  }

  async setStepGoal(daily_steps: number): Promise<void> {
    try {
      await api.put('/api/v1/health/logging/steps/goal', { daily_steps });
      DebugUtils.log('Step goal updated successfully');
    } catch (error) {
      DebugUtils.error('Failed to set step goal:', error);
      throw error;
    }
  }

  // ===== HEALTH SUMMARY =====

  async getHealthSummary(): Promise<HealthSummary> {
    try {
      const response = await api.get('/api/v1/health/summary');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch health summary:', error);
      throw error;
    }
  }

  async getHealthInsights(): Promise<HealthInsights> {
    try {
      const response = await api.get('/api/v1/health/insights');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch health insights:', error);
      throw error;
    }
  }

  // ===== HEALTH RECOMMENDATIONS =====

  async getPersonalizedRecommendations(): Promise<{
    nutrition: string[];
    fitness: string[];
    wellness: string[];
    lifestyle: string[];
    priority: 'high' | 'medium' | 'low';
  }> {
    try {
      const response = await api.get('/api/v1/health/recommendations');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch personalized recommendations:', error);
      throw error;
    }
  }

  // ===== HEALTH TRENDS =====

  async getHealthTrends(period: 'week' | 'month' | 'quarter' = 'month'): Promise<{
    weight_trend: Array<{ date: string; weight: number }>;
    mood_trend: Array<{ date: string; rating: number }>;
    activity_trend: Array<{ date: string; steps: number; calories: number }>;
    water_trend: Array<{ date: string; ml: number }>;
    overall_health_score_trend: Array<{ date: string; score: number }>;
  }> {
    try {
      const response = await api.get(`/api/v1/health/trends/${period}`);
      return response;
    } catch (error) {
      DebugUtils.error(`Failed to fetch ${period} health trends:`, error);
      throw error;
    }
  }

  // ===== HEALTH GOALS =====

  async setHealthGoals(goals: {
    target_weight?: number;
    target_bmi?: number;
    daily_steps?: number;
    daily_water_ml?: number;
    weekly_workouts?: number;
    mood_rating_goal?: number;
  }): Promise<void> {
    try {
      await api.put('/api/v1/health/goals', goals);
      DebugUtils.log('Health goals updated successfully');
    } catch (error) {
      DebugUtils.error('Failed to set health goals:', error);
      throw error;
    }
  }

  async getHealthGoals(): Promise<{
    target_weight: number;
    target_bmi: number;
    daily_steps: number;
    daily_water_ml: number;
    weekly_workouts: number;
    mood_rating_goal: number;
    progress: {
      weight_progress: number;
      bmi_progress: number;
      steps_progress: number;
      water_progress: number;
      workouts_progress: number;
      mood_progress: number;
    };
  }> {
    try {
      const response = await api.get('/api/v1/health/goals');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch health goals:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const healthService = new ConsolidatedHealthService();
export default healthService;
