import { apiClient } from './api';

export interface HealthData {
  message?: string;
  status?: string;
  // Add more fields based on your backend response
}

export interface HealthProfile {
  id: number;
  user_id: number;
  age?: number;
  height_cm?: number;
  current_weight_kg?: number;
  gender?: string;
  activity_level?: string;
  fitness_goals?: string[];
  dietary_preferences?: string[];
  created_at: string;
  updated_at: string;
}

export interface HealthInsights {
  achievements: {
    id: number;
    title: string;
    description: string;
    unlocked_at: string;
  }[];
  tips: {
    id: number;
    title: string;
    message: string;
    category: string;
  }[];
  patterns: {
    type: string;
    description: string;
    confidence: number;
  }[];
}

export interface WaterLog {
  id: number;
  user_id: number;
  amount_ml: number;
  log_date: string;
  created_at: string;
  updated_at: string;
}

export interface MoodLog {
  id: number;
  user_id: number;
  mood_rating: number;
  energy_level?: number;
  stress_level?: number;
  sleep_quality?: number;
  sleep_hours?: number;
  water_intake_ml?: number;
  steps_count?: number;
  weight_kg?: number;
  notes?: string;
  activities?: string;
  log_date: string;
  created_at: string;
  updated_at: string;
}

export const healthService = {
  async getHealthData(): Promise<HealthData> {
    try {
      console.log('🏥 Health Service: Fetching health data...');
      const response = await apiClient.get('/health');
      console.log('🏥 Health Service: Health data received:', response.data);
      return response.data;
    } catch (error) {
      console.error('🏥 Health Service: Error fetching health data:', error);
      throw error;
    }
  },

  async getHealthProfile(): Promise<HealthProfile | null> {
    try {
      console.log('🏥 Health Service: Fetching health profile...');
      const response = await apiClient.get('/health/profile/');
      console.log('🏥 Health Service: Profile received:', response.data);
      return response.data;
    } catch (error) {
      console.error('🏥 Health Service: Error fetching health profile:', error);
      return null;
    }
  },

  async updateHealthProfile(profileData: Partial<HealthProfile>): Promise<HealthProfile> {
    try {
      console.log('🏥 Health Service: Updating health profile...', profileData);
      const response = await apiClient.put('/health/profile/', profileData);
      console.log('🏥 Health Service: Profile updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('🏥 Health Service: Error updating health profile:', error);
      throw error;
    }
  },

  async getHealthInsights(): Promise<HealthInsights> {
    try {
      console.log('🏥 Health Service: Fetching health insights...');
      const response = await apiClient.get('/health/insights/suggestions');
      console.log('🏥 Health Service: Insights received:', response.data);
      return response.data;
    } catch (error) {
      console.error('🏥 Health Service: Error fetching health insights:', error);
      throw error;
    }
  },

  async getHealthScore(): Promise<{ score: number; breakdown: any }> {
    try {
      console.log('🏥 Health Service: Fetching health score...');
      const response = await apiClient.get('/health/insights/health-score');
      console.log('🏥 Health Service: Health score received:', response.data);
      return response.data;
    } catch (error) {
      console.error('🏥 Health Service: Error fetching health score:', error);
      throw error;
    }
  },

  async getWeeklyReport(): Promise<any> {
    try {
      console.log('🏥 Health Service: Fetching weekly report...');
      const response = await apiClient.get('/health/insights/weekly-report');
      console.log('🏥 Health Service: Weekly report received:', response.data);
      return response.data;
    } catch (error) {
      console.error('🏥 Health Service: Error fetching weekly report:', error);
      throw error;
    }
  },

  // Water logging
  async getWaterLogs(days: number = 7): Promise<WaterLog[]> {
    try {
      console.log('🏥 Health Service: Fetching water logs...', days);
      const response = await apiClient.get('/health/water-logs/', {
        params: { days }
      });
      console.log('🏥 Health Service: Water logs received:', response.data);
      return response.data;
    } catch (error) {
      console.error('🏥 Health Service: Error fetching water logs:', error);
      throw error;
    }
  },

  async logWater(amount_ml: number): Promise<WaterLog> {
    try {
      console.log('🏥 Health Service: Logging water...', amount_ml);
      const response = await apiClient.post('/health/logging/water', {
        amount_ml,
        log_date: new Date().toISOString()
      });
      console.log('🏥 Health Service: Water logged:', response.data);
      return response.data;
    } catch (error) {
      console.error('🏥 Health Service: Error logging water:', error);
      throw error;
    }
  },

  // Mood logging
  async getMoodLogs(days: number = 7): Promise<MoodLog[]> {
    try {
      console.log('🏥 Health Service: Fetching mood logs...', days);
      const response = await apiClient.get('/health/logging/mood', {
        params: { days }
      });
      console.log('🏥 Health Service: Mood logs received:', response.data);
      return response.data;
    } catch (error) {
      console.error('🏥 Health Service: Error fetching mood logs:', error);
      throw error;
    }
  },

  async logMood(moodData: {
    mood_rating: number;
    energy_level?: number;
    stress_level?: number;
    sleep_quality?: number;
    sleep_hours?: number;
    water_intake_ml?: number;
    steps_count?: number;
    weight_kg?: number;
    notes?: string;
    activities?: string;
  }): Promise<MoodLog> {
    try {
      console.log('🏥 Health Service: Logging mood...', moodData);
      const response = await apiClient.post('/health/logging/mood', {
        ...moodData,
        log_date: new Date().toISOString()
      });
      console.log('🏥 Health Service: Mood logged:', response.data);
      return response.data;
    } catch (error) {
      console.error('🏥 Health Service: Error logging mood:', error);
      throw error;
    }
  },

  // Analytics
  async getAnalyticsData(): Promise<any> {
    try {
      console.log('🏥 Health Service: Fetching analytics data...');
      const response = await apiClient.get('/health/analytics/dashboard');
      console.log('🏥 Health Service: Analytics received:', response.data);
      return response.data;
    } catch (error) {
      console.error('🏥 Health Service: Error fetching analytics:', error);
      throw error;
    }
  }
};
