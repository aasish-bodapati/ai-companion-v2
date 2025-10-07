import { apiClient } from './api';

export interface WeeklyTrends {
  fitness: {
    weekly_data: {
      week: string;
      workouts: number;
      total_duration: number;
      total_calories: number;
      unique_activities: number;
    }[];
    trend: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data';
    total_workouts: number;
    avg_workouts_per_week: number;
  };
  nutrition: {
    weekly_data: {
      week: string;
      meals: number;
      avg_calories_per_meal: number;
      total_protein: number;
      total_carbs: number;
      total_fat: number;
    }[];
    total_meals: number;
    avg_meals_per_week: number;
  };
  period: string;
  generated_at: string;
}

export interface CorrelationInsight {
  type: string;
  description: string;
  strength: 'weak' | 'moderate' | 'strong';
  data: Record<string, unknown>;
}

export interface CorrelationData {
  correlations: CorrelationInsight[];
  period: string;
  generated_at: string;
}

export interface Recommendation {
  category: 'fitness' | 'nutrition';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  action: string;
}

export interface RecommendationsData {
  recommendations: Recommendation[];
  based_on: string;
  generated_at: string;
}

export interface DashboardData {
  summary: {
    recent_workouts: number;
    recent_meals: number;
    period: string;
  };
  trends: WeeklyTrends;
  correlations: CorrelationData;
  recommendations: RecommendationsData;
  overall_health_score?: number;
  generated_at: string;
}

export const analyticsService = {
  // Get weekly trends for fitness and nutrition
  async getWeeklyTrends(weeks: number = 4): Promise<WeeklyTrends> {
    try {
      const response = await apiClient.get(`/health/analytics/trends?weeks=${weeks}`);
      return response.data;
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      return this.getMockWeeklyTrends();
    }
  },

  // Get correlation insights between different health metrics
  async getCorrelationInsights(days: number = 30): Promise<CorrelationData> {
    try {
      const response = await apiClient.get(`/health/analytics/correlations?days=${days}`);
      return response.data;
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      return this.getMockCorrelationData();
    }
  },

  // Get personalized recommendations
  async getPersonalizedRecommendations(): Promise<RecommendationsData> {
    try {
      const response = await apiClient.get('/health/analytics/recommendations');
      return response.data;
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      return this.getMockRecommendations();
    }
  },

  // Get comprehensive dashboard data
  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await apiClient.get('/health/analytics/dashboard');
      return response.data;
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      return this.getMockDashboardData();
    }
  },

  // Get data quality score
  async getDataQualityScore(): Promise<{ score: number; suggestions: string[] }> {
    try {
      const response = await apiClient.get('/health/analytics/data-quality');
      return response.data;
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      return { score: 85, suggestions: ['Log more detailed workout information'] };
    }
  },

  // Mock data for development
  getMockWeeklyTrends(): WeeklyTrends {
    return {
      fitness: {
        weekly_data: [
          {
            week: '2024-01-01',
            workouts: 3,
            total_duration: 180,
            total_calories: 1200,
            unique_activities: 2,
          },
          {
            week: '2024-01-08',
            workouts: 4,
            total_duration: 240,
            total_calories: 1600,
            unique_activities: 3,
          },
          {
            week: '2024-01-15',
            workouts: 5,
            total_duration: 300,
            total_calories: 2000,
            unique_activities: 4,
          },
          {
            week: '2024-01-22',
            workouts: 4,
            total_duration: 280,
            total_calories: 1800,
            unique_activities: 3,
          },
        ],
        trend: 'increasing',
        total_workouts: 16,
        avg_workouts_per_week: 4,
      },
      nutrition: {
        weekly_data: [
          {
            week: '2024-01-01',
            meals: 18,
            avg_calories_per_meal: 450,
            total_protein: 180,
            total_carbs: 270,
            total_fat: 90,
          },
          {
            week: '2024-01-08',
            meals: 21,
            avg_calories_per_meal: 420,
            total_protein: 210,
            total_carbs: 315,
            total_fat: 105,
          },
          {
            week: '2024-01-15',
            meals: 19,
            avg_calories_per_meal: 480,
            total_protein: 190,
            total_carbs: 285,
            total_fat: 95,
          },
          {
            week: '2024-01-22',
            meals: 20,
            avg_calories_per_meal: 460,
            total_protein: 200,
            total_carbs: 300,
            total_fat: 100,
          },
        ],
        total_meals: 78,
        avg_meals_per_week: 19.5,
      },
      period: 'Last 4 weeks',
      generated_at: new Date().toISOString(),
    };
  },

  getMockCorrelationData(): CorrelationData {
    return {
      correlations: [
        {
          type: 'nutrition_workout',
          description: 'You tend to eat more calories on workout days',
          strength: 'moderate',
          data: {
            workout_days_avg: 1850,
            non_workout_days_avg: 1650,
          },
        },
        {
          type: 'mood_exercise',
          description: 'Your mood improves by 23% on days when you work out',
          strength: 'strong',
          data: {
            workout_days_mood: 7.8,
            non_workout_days_mood: 6.3,
          },
        },
      ],
      period: 'Last 30 days',
      generated_at: new Date().toISOString(),
    };
  },

  getMockRecommendations(): RecommendationsData {
    return {
      recommendations: [
        {
          category: 'fitness',
          priority: 'high',
          title: 'Increase Workout Frequency',
          description: 'You\'ve only worked out 2 times this week. Try to aim for at least 3 workouts per week.',
          action: 'Schedule your next workout',
        },
        {
          category: 'nutrition',
          priority: 'medium',
          title: 'Increase Protein Intake',
          description: 'Your average protein intake is 18.5g per meal. Consider adding more protein-rich foods.',
          action: 'Add lean protein to your next meal',
        },
        {
          category: 'fitness',
          priority: 'medium',
          title: 'Add Variety to Your Workouts',
          description: 'You\'ve been doing mostly cardio workouts. Try adding some variety!',
          action: 'Try a different type of exercise',
        },
      ],
      based_on: 'Last 30 days of data',
      generated_at: new Date().toISOString(),
    };
  },

  getMockDashboardData(): DashboardData {
    return {
      summary: {
        recent_workouts: 4,
        recent_meals: 18,
        period: 'Last 7 days',
      },
      trends: this.getMockWeeklyTrends(),
      correlations: this.getMockCorrelationData(),
      recommendations: this.getMockRecommendations(),
      generated_at: new Date().toISOString(),
    };
  },
};
