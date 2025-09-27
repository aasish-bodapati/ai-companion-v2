import { apiClient } from './api';

export interface MoodLog {
  id: number;
  user_id: number;
  mood_rating: number;
  notes?: string;
  log_date: string;
  created_at: string;
  updated_at: string;
}

export interface MoodLogCreate {
  mood_rating: number;
  mood_label?: string;
  mood_emoji?: string;
  notes?: string;
  log_date?: string;
}

export interface MoodLogUpdate {
  mood_rating?: number;
  mood_label?: string;
  mood_emoji?: string;
  notes?: string;
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

export const moodService = {
  // Get mood logs with filtering
  async getMoodLogs(params?: {
    skip?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<MoodLog[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.skip) queryParams.append('skip', params.skip.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.start_date) queryParams.append('start_date', params.start_date);
      if (params?.end_date) queryParams.append('end_date', params.end_date);

      const response = await apiClient.get(`/health/logging/mood?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get mood logs:', error);
      throw error;
    }
  },

  // Get today's mood logs
  async getTodaysMoodLogs(): Promise<MoodLog[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await apiClient.get(`/health/logging/mood?start_date=${today}&end_date=${today}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get today\'s mood logs:', error);
      throw error;
    }
  },

  // Create a new mood log
  async createMoodLog(moodData: MoodLogCreate): Promise<MoodLog> {
    try {
      const response = await apiClient.post('/health/logging/mood', moodData);
      return response.data;
    } catch (error) {
      console.error('Failed to create mood log:', error);
      throw error;
    }
  },

  // Update a mood log
  async updateMoodLog(logId: string, updateData: MoodLogUpdate): Promise<MoodLog> {
    try {
      const response = await apiClient.put(`/health/logging/mood/${logId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Failed to update mood log:', error);
      throw error;
    }
  },

  // Delete a mood log
  async deleteMoodLog(logId: string): Promise<void> {
    try {
      await apiClient.delete(`/health/logging/mood/${logId}`);
    } catch (error) {
      console.error('Failed to delete mood log:', error);
      throw error;
    }
  },

  // Quick log mood (1-10 scale)
  async quickLogMood(rating: number, moodLabel?: string, moodEmoji?: string, notes?: string): Promise<MoodLog> {
    try {
      const moodData: MoodLogCreate = {
        mood_rating: rating,
        mood_label: moodLabel,
        mood_emoji: moodEmoji,
        notes: notes,
        log_date: new Date().toISOString(),
      };
      
      const result = await this.createMoodLog(moodData);
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Get mood statistics
  async getMoodStats(days: number = 30): Promise<MoodStats> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const logs = await this.getMoodLogs({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        limit: 100,
      });

      const totalLogs = logs.length;
      const averageMood = totalLogs > 0 
        ? logs.reduce((sum, log) => sum + log.mood_rating, 0) / totalLogs 
        : 0;

      // Calculate trend (simple comparison of first half vs second half)
      let moodTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (totalLogs >= 4) {
        const midpoint = Math.floor(totalLogs / 2);
        const firstHalf = logs.slice(0, midpoint);
        const secondHalf = logs.slice(midpoint);
        
        const firstHalfAvg = firstHalf.reduce((sum, log) => sum + log.mood_rating, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, log) => sum + log.mood_rating, 0) / secondHalf.length;
        
        if (secondHalfAvg > firstHalfAvg + 0.5) moodTrend = 'increasing';
        else if (secondHalfAvg < firstHalfAvg - 0.5) moodTrend = 'decreasing';
      }

      // Calculate mood distribution
      const moodDistribution = Array.from({ length: 10 }, (_, i) => ({
        rating: i + 1,
        count: logs.filter(log => log.mood_rating === i + 1).length,
      }));

      return {
        total_logs: totalLogs,
        average_mood: Math.round(averageMood * 10) / 10,
        mood_trend: moodTrend,
        recent_logs: logs.slice(0, 7), // Last 7 logs
        mood_distribution: moodDistribution,
      };
    } catch (error) {
      console.error('Failed to get mood stats:', error);
      throw error;
    }
  },

  // Get mood insights
  async getMoodInsights(): Promise<{
    insights: string[];
    recommendations: string[];
  }> {
    try {
      const stats = await this.getMoodStats(30);
      
      const insights: string[] = [];
      const recommendations: string[] = [];

      if (stats.total_logs === 0) {
        insights.push('Start logging your mood to track your emotional well-being');
        recommendations.push('Try logging your mood once or twice daily');
      } else {
        if (stats.average_mood >= 7) {
          insights.push('You\'ve been feeling great lately!');
          recommendations.push('Keep up whatever is making you feel good');
        } else if (stats.average_mood <= 4) {
          insights.push('Your mood has been lower recently');
          recommendations.push('Consider reaching out to friends or trying relaxation techniques');
        } else {
          insights.push('Your mood has been stable overall');
          recommendations.push('Continue tracking to identify patterns');
        }

        if (stats.mood_trend === 'increasing') {
          insights.push('Your mood is trending upward');
        } else if (stats.mood_trend === 'decreasing') {
          insights.push('Your mood has been declining');
          recommendations.push('Consider talking to someone about how you\'re feeling');
        }
      }

      return { insights, recommendations };
    } catch (error) {
      console.error('Failed to get mood insights:', error);
      return { insights: [], recommendations: [] };
    }
  },
};
