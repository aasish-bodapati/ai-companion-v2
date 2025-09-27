import { apiClient } from './api';

export interface HealthData {
  message?: string;
  status?: string;
  // Add more fields based on your backend response
}

export interface HealthProfile {
  id: string;
  user_id: string;
  age?: number;
  height?: number;
  weight?: number;
  gender?: string;
  activity_level?: string;
  fitness_goals?: string[];
  dietary_preferences?: string[];
  created_at: string;
  updated_at: string;
}

export interface HealthInsights {
  achievements: {
    id: string;
    title: string;
    description: string;
    unlocked_at: string;
  }[];
  tips: {
    id: string;
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

export const healthService = {
  async getHealthData(): Promise<HealthData> {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getHealthProfile(): Promise<HealthProfile | null> {
    try {
      const response = await apiClient.get('/health/profile/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch health profile:', error);
      return null;
    }
  },

  async updateHealthProfile(profileData: Partial<HealthProfile>): Promise<HealthProfile> {
    try {
      const response = await apiClient.put('/health/profile/', profileData);
      return response.data;
    } catch (error) {
      console.error('Failed to update health profile:', error);
      throw error;
    }
  },

  async getHealthInsights(): Promise<HealthInsights> {
    try {
      const response = await apiClient.get('/health/insights/suggestions');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch health insights:', error);
      throw error;
    }
  },

  async getHealthScore(): Promise<{ score: number; breakdown: any }> {
    try {
      const response = await apiClient.get('/health/insights/health-score');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch health score:', error);
      throw error;
    }
  },

  async getWeeklyReport(): Promise<any> {
    try {
      const response = await apiClient.get('/health/insights/weekly-report');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch weekly report:', error);
      throw error;
    }
  }
};
