import { apiClient } from './api';
import { BaseService } from './BaseService';

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

class HealthService extends BaseService {
  async getHealthData(): Promise<HealthData> {
    console.log('🏥 Health Service: Fetching health data...');
    return this.makeRequest(
      () => apiClient.get('/health'),
      'HEALTH SERVICE - getHealthData'
    ).then(data => {
      console.log('🏥 Health Service: Health data received:', data);
      return data;
    });
  }

  async getHealthProfile(): Promise<HealthProfile | null> {
    try {
      console.log('🏥 Health Service: Fetching health profile...');
      const data = await this.makeRequest(
        () => apiClient.get('/health/profile/'),
        'HEALTH SERVICE - getHealthProfile'
      );
      console.log('🏥 Health Service: Profile received:', data);
      return data;
    } catch (error) {
      this.handleError(error, 'HEALTH SERVICE - getHealthProfile');
      return null;
    }
  }

  async updateHealthProfile(profileData: Partial<HealthProfile>): Promise<HealthProfile> {
    console.log('🏥 Health Service: Updating health profile...', profileData);
    return this.makeRequest(
      () => apiClient.put('/health/profile/', profileData),
      'HEALTH SERVICE - updateHealthProfile'
    ).then(data => {
      console.log('🏥 Health Service: Profile updated:', data);
      return data;
    });
  }

  async getHealthInsights(): Promise<HealthInsights> {
    console.log('🏥 Health Service: Fetching health insights...');
    return this.makeRequest(
      () => apiClient.get('/health/insights/suggestions'),
      'HEALTH SERVICE - getHealthInsights'
    ).then(data => {
      console.log('🏥 Health Service: Insights received:', data);
      return data;
    });
  }

  async getHealthScore(): Promise<{ score: number; breakdown: any }> {
    console.log('🏥 Health Service: Fetching health score...');
    return this.makeRequest(
      () => apiClient.get('/health/insights/health-score'),
      'HEALTH SERVICE - getHealthScore'
    ).then(data => {
      console.log('🏥 Health Service: Health score received:', data);
      return data;
    });
  }

  async getWeeklyReport(): Promise<any> {
    console.log('🏥 Health Service: Fetching weekly report...');
    return this.makeRequest(
      () => apiClient.get('/health/insights/weekly-report'),
      'HEALTH SERVICE - getWeeklyReport'
    ).then(data => {
      console.log('🏥 Health Service: Weekly report received:', data);
      return data;
    });
  }

  // Analytics
  async getAnalyticsData(): Promise<any> {
    console.log('🏥 Health Service: Fetching analytics data...');
    return this.makeRequest(
      () => apiClient.get('/health/analytics/dashboard'),
      'HEALTH SERVICE - getAnalyticsData'
    ).then(data => {
      console.log('🏥 Health Service: Analytics received:', data);
      return data;
    });
  }

  // Water logging (delegated to waterService for consistency)
  async getWaterLogs(days: number = 7): Promise<any[]> {
    console.log('🏥 Health Service: Delegating to waterService for water logs...', days);
    const { waterService } = await import('./waterService');
    return waterService.getWaterLogs(days);
  }

  async logWater(amount_ml: number): Promise<any> {
    console.log('🏥 Health Service: Delegating to waterService for water logging...', amount_ml);
    const { waterService } = await import('./waterService');
    return waterService.createWaterLog({ amount_ml });
  }

  // Mood logging (delegated to moodService for consistency)
  async getMoodLogs(days: number = 7): Promise<any[]> {
    console.log('🏥 Health Service: Delegating to moodService for mood logs...', days);
    const { moodService } = await import('./moodService');
    return moodService.getMoodLogs({ 
      start_date: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0]
    });
  }

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
  }): Promise<any> {
    console.log('🏥 Health Service: Delegating to moodService for mood logging...', moodData);
    const { moodService } = await import('./moodService');
    return moodService.createMoodLog({
      mood_rating: moodData.mood_rating,
      mood_label: moodData.notes,
      notes: moodData.notes
    });
  }
}

// Export singleton instance to maintain backward compatibility
export const healthService = new HealthService();
