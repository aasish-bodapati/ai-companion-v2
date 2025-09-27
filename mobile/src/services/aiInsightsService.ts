import { apiClient } from './api';

export interface HealthPattern {
  type: 'correlation' | 'trend' | 'anomaly' | 'achievement';
  title: string;
  description: string;
  confidence: number; // 0-100
  data_points: number;
  timeframe: string;
  impact: 'positive' | 'negative' | 'neutral';
  recommendations?: string[];
}

export interface AIInsight {
  id: string;
  type: 'pattern' | 'recommendation' | 'achievement' | 'warning';
  title: string;
  message: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  category: 'fitness' | 'nutrition' | 'mood' | 'general';
  actionable: boolean;
  action_url?: string;
  created_at: string;
  expires_at?: string;
}

export interface HealthRecommendation {
  id: string;
  type: 'workout' | 'nutrition' | 'lifestyle' | 'goal';
  title: string;
  description: string;
  reasoning: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_impact: 'low' | 'medium' | 'high';
  time_commitment: string;
  category: string;
  tags: string[];
}

export interface ProgressAnalysis {
  period: 'week' | 'month' | 'quarter' | 'year';
  fitness_trends: {
    workout_frequency: number; // % change
    duration_trend: number;
    intensity_trend: number;
    consistency_score: number; // 0-100
  };
  nutrition_trends: {
    calorie_balance: number;
    macro_balance: number;
    meal_consistency: number;
    hydration_score: number;
  };
  mood_trends: {
    average_mood: number;
    mood_stability: number;
    energy_levels: number;
    stress_indicators: number;
  };
  overall_health_score: number; // 0-100
  key_insights: string[];
  recommendations: HealthRecommendation[];
}

export interface GoalAnalysis {
  goal_id: string;
  goal_title: string;
  current_progress: number; // 0-100
  projected_completion: string;
  on_track: boolean;
  challenges: string[];
  opportunities: string[];
  next_milestone: {
    title: string;
    target_date: string;
    required_actions: string[];
  };
}

export const aiInsightsService = {
  // Get AI-generated health insights
  async getHealthInsights(limit: number = 10): Promise<AIInsight[]> {
    try {
      const response = await apiClient.get(`/health/insights/suggestions?limit=${limit}`);
      return Array.isArray(response.data) ? response.data : this.getMockInsights();
    } catch (error) {
      console.error('Failed to fetch health insights:', error);
      // Return mock data for development
      return this.getMockInsights();
    }
  },

  // Get health patterns and correlations
  async getHealthPatterns(): Promise<HealthPattern[]> {
    try {
      const response = await apiClient.get('/health/insights/patterns');
      return Array.isArray(response.data) ? response.data : this.getMockPatterns();
    } catch (error) {
      console.error('Failed to fetch health patterns:', error);
      return this.getMockPatterns();
    }
  },

  // Get personalized recommendations
  async getRecommendations(category?: string): Promise<HealthRecommendation[]> {
    try {
      const params = category ? `?category=${category}` : '';
      const response = await apiClient.get(`/health/insights/suggestions${params}`);
      return Array.isArray(response.data) ? response.data : this.getMockRecommendations();
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      return this.getMockRecommendations();
    }
  },

  // Get progress analysis
  async getProgressAnalysis(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<ProgressAnalysis> {
    try {
      const response = await apiClient.get(`/health/insights/trends?period=${period}`);
      // The API returns an array of trends, but we need a single analysis object
      if (Array.isArray(response.data)) {
        // Transform the API response to our expected format
        return this.transformTrendsToAnalysis(response.data, period);
      }
      return response.data;
    } catch (error) {
      console.error('Failed to fetch progress analysis:', error);
      return this.getMockProgressAnalysis(period);
    }
  },

  // Transform API trends response to analysis format
  transformTrendsToAnalysis(trends: any[], period: string): ProgressAnalysis {
    const workoutTrend = trends.find(t => t.metric_name === 'workouts') || trends[0];
    
    return {
      period: period as any,
      fitness_trends: {
        workout_frequency: workoutTrend?.change_percentage || 0,
        duration_trend: 0,
        intensity_trend: 0,
        consistency_score: 75,
      },
      nutrition_trends: {
        calorie_balance: 0,
        macro_balance: 0,
        meal_consistency: 70,
        hydration_score: 80,
      },
      mood_trends: {
        average_mood: 7.0,
        mood_stability: 70,
        energy_levels: 75,
        stress_indicators: 25,
      },
      overall_health_score: 75,
      key_insights: [workoutTrend?.interpretation || 'Keep up the great work!'],
      recommendations: [],
    };
  },

  // Get goal analysis
  async getGoalAnalysis(goalId?: string): Promise<GoalAnalysis[]> {
    try {
      const params = goalId ? `?goal_id=${goalId}` : '';
      const response = await apiClient.get(`/health/insights/goals/progress${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch goal analysis:', error);
      return this.getMockGoalAnalysis();
    }
  },

  // Get personalized coaching message
  async getCoachingMessage(context?: string): Promise<string> {
    try {
      const params = context ? `?context=${context}` : '';
      const response = await apiClient.get(`/health/insights/motivation${params}`);
      return response.data.message;
    } catch (error) {
      console.error('Failed to fetch coaching message:', error);
      return this.getMockCoachingMessage();
    }
  },

  // Submit feedback on AI insights
  async submitInsightFeedback(insightId: string, feedback: {
    helpful: boolean;
    accuracy: number; // 1-5
    comments?: string;
  }) {
    try {
      await apiClient.post(`/health/insights/${insightId}/feedback`, feedback);
    } catch (error) {
      console.error('Failed to submit insight feedback:', error);
    }
  },

  // Get AI-generated workout suggestions
  async getWorkoutSuggestions(preferences?: {
    duration?: number;
    intensity?: 'low' | 'medium' | 'high';
    focus?: string[];
    equipment?: string[];
  }) {
    try {
      const response = await apiClient.post('/health/insights/workout-suggestions', preferences || {});
      return response.data;
    } catch (error) {
      console.error('Failed to fetch workout suggestions:', error);
      return this.getMockWorkoutSuggestions();
    }
  },

  // Get AI-generated nutrition suggestions
  async getNutritionSuggestions(mealType?: string, preferences?: {
    dietary_restrictions?: string[];
    calorie_target?: number;
    macro_goals?: { protein: number; carbs: number; fat: number };
  }) {
    try {
      const data = { meal_type: mealType, ...preferences };
      const response = await apiClient.post('/health/insights/nutrition-suggestions', data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch nutrition suggestions:', error);
      return this.getMockNutritionSuggestions();
    }
  },

  // Mock data for development
  getMockInsights(): AIInsight[] {
    return [
      {
        id: '1',
        type: 'pattern',
        title: 'Workout Consistency Pattern',
        message: 'You work out most consistently on Tuesdays and Thursdays. Consider adding a third day to maximize your progress.',
        confidence: 85,
        priority: 'medium',
        category: 'fitness',
        actionable: true,
        action_url: '/fitness?tab=routines',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'achievement',
        title: 'Calorie Burn Milestone',
        message: 'You\'ve burned 10,000 calories this month! That\'s equivalent to running 100 miles.',
        confidence: 100,
        priority: 'high',
        category: 'fitness',
        actionable: false,
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        type: 'recommendation',
        title: 'Hydration Improvement',
        message: 'Your water intake has decreased by 20% this week. Try setting hourly reminders to drink water.',
        confidence: 75,
        priority: 'medium',
        category: 'nutrition',
        actionable: true,
        action_url: '/nutrition?tab=hydration',
        created_at: new Date().toISOString(),
      },
    ];
  },

  getMockPatterns(): HealthPattern[] {
    return [
      {
        type: 'correlation',
        title: 'Workout-Mood Correlation',
        description: 'Your mood improves by 23% on days when you work out for at least 30 minutes.',
        confidence: 78,
        data_points: 45,
        timeframe: 'last 30 days',
        impact: 'positive',
        recommendations: [
          'Try to maintain at least 30 minutes of exercise daily',
          'Consider morning workouts to start your day positively',
        ],
      },
      {
        type: 'trend',
        title: 'Increasing Workout Duration',
        description: 'Your average workout duration has increased by 15% over the past month.',
        confidence: 92,
        data_points: 28,
        timeframe: 'last 30 days',
        impact: 'positive',
        recommendations: [
          'Great progress! Consider adding variety to prevent plateau',
          'Monitor for signs of overtraining',
        ],
      },
    ];
  },

  getMockRecommendations(): HealthRecommendation[] {
    return [
      {
        id: '1',
        type: 'workout',
        title: 'Add HIIT Training',
        description: 'Incorporate 2 HIIT sessions per week to boost fat burning and cardiovascular fitness.',
        reasoning: 'Your current cardio routine is steady-state. HIIT can provide 20% more calorie burn in half the time.',
        difficulty: 'medium',
        estimated_impact: 'high',
        time_commitment: '20-30 minutes',
        category: 'cardio',
        tags: ['hiit', 'fat-burning', 'cardio'],
      },
      {
        id: '2',
        type: 'nutrition',
        title: 'Increase Protein Intake',
        description: 'Aim for 1.2g protein per kg body weight to support muscle recovery and growth.',
        reasoning: 'Your current protein intake is 0.8g/kg, which may limit muscle recovery and growth.',
        difficulty: 'easy',
        estimated_impact: 'medium',
        time_commitment: '5-10 minutes planning',
        category: 'macros',
        tags: ['protein', 'muscle-building', 'recovery'],
      },
    ];
  },

  getMockProgressAnalysis(period: string): ProgressAnalysis {
    return {
      period: period as any,
      fitness_trends: {
        workout_frequency: 15,
        duration_trend: 8,
        intensity_trend: 12,
        consistency_score: 78,
      },
      nutrition_trends: {
        calorie_balance: -5,
        macro_balance: 12,
        meal_consistency: 65,
        hydration_score: 72,
      },
      mood_trends: {
        average_mood: 7.2,
        mood_stability: 68,
        energy_levels: 75,
        stress_indicators: 25,
      },
      overall_health_score: 73,
      key_insights: [
        'Your workout consistency has improved significantly',
        'Nutrition tracking is becoming more regular',
        'Mood and energy levels are stable and positive',
      ],
      recommendations: this.getMockRecommendations(),
    };
  },

  getMockGoalAnalysis(): GoalAnalysis[] {
    return [
      {
        goal_id: '1',
        goal_title: 'Lose 10 pounds',
        current_progress: 60,
        projected_completion: '2024-02-15',
        on_track: true,
        challenges: ['Weekend eating habits', 'Stress eating'],
        opportunities: ['Increase water intake', 'Add more cardio'],
        next_milestone: {
          title: 'Lose 2 more pounds',
          target_date: '2024-01-31',
          required_actions: ['Maintain calorie deficit', 'Increase workout frequency'],
        },
      },
    ];
  },

  getMockCoachingMessage(): string {
    const messages = [
      "You're doing great! Your consistency is paying off. Keep up the excellent work! 💪",
      "I noticed you've been hitting your workout goals. Try adding some variety to keep things interesting! 🎯",
      "Your progress is impressive! Remember to listen to your body and take rest when needed. 🧘‍♀️",
      "Great job on staying consistent! Small improvements every day lead to big changes over time. 🌟",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  },

  getMockWorkoutSuggestions() {
    return [
      {
        id: '1',
        name: 'Upper Body Strength',
        duration: 45,
        difficulty: 'intermediate',
        exercises: ['Push-ups', 'Pull-ups', 'Dumbbell Press', 'Rows'],
        calories_burned: 350,
        description: 'A balanced upper body workout focusing on pushing and pulling movements.',
      },
      {
        id: '2',
        name: 'HIIT Cardio Blast',
        duration: 20,
        difficulty: 'advanced',
        exercises: ['Burpees', 'Mountain Climbers', 'Jump Squats', 'High Knees'],
        calories_burned: 300,
        description: 'High-intensity interval training for maximum calorie burn.',
      },
    ];
  },

  getMockNutritionSuggestions() {
    return [
      {
        id: '1',
        name: 'Protein Power Bowl',
        calories: 450,
        protein: 35,
        carbs: 25,
        fat: 20,
        ingredients: ['Grilled chicken', 'Quinoa', 'Avocado', 'Spinach'],
        prep_time: '15 minutes',
        description: 'A balanced meal perfect for post-workout recovery.',
      },
      {
        id: '2',
        name: 'Green Smoothie',
        calories: 200,
        protein: 15,
        carbs: 30,
        fat: 5,
        ingredients: ['Spinach', 'Banana', 'Protein powder', 'Almond milk'],
        prep_time: '5 minutes',
        description: 'Quick and nutritious breakfast or snack option.',
      },
    ];
  },
};
