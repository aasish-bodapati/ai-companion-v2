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
    const data = await this.makeRequest(
      () => apiClient.get('/health'),
      'HEALTH SERVICE - getHealthData'
    );
    return data;
  }

  async getHealthProfile(): Promise<HealthProfile | null> {
    try {
      const data = await this.makeRequest(
        () => apiClient.get('/health/profile/'),
        'HEALTH SERVICE - getHealthProfile'
      );
      return data;
    } catch (error) {
      this.handleError(error, 'HEALTH SERVICE - getHealthProfile');
      return null;
    }
  }

  async updateHealthProfile(profileData: Partial<HealthProfile>): Promise<HealthProfile> {
    const data = await this.makeRequest(
      () => apiClient.put('/health/profile/', profileData),
      'HEALTH SERVICE - updateHealthProfile'
    );
    return data;
  }

  async getHealthInsights(): Promise<HealthInsights> {
    const data = await this.makeRequest(
      () => apiClient.get('/health/insights/suggestions'),
      'HEALTH SERVICE - getHealthInsights'
    );
    return data;
  }

  async getHealthScore(): Promise<{ score: number; breakdown: Record<string, unknown> }> {
    const data = await this.makeRequest(
      () => apiClient.get('/health/insights/health-score'),
      'HEALTH SERVICE - getHealthScore'
    );
    return data;
  }

  async getWeeklyReport(): Promise<any> {
    const data = await this.makeRequest(
      () => apiClient.get('/health/insights/weekly-report'),
      'HEALTH SERVICE - getWeeklyReport'
    );
    return data;
  }


  // Water logging (delegated to simpleWaterService for consistency)
  async getWaterLogs(days: number = 7): Promise<any[]> {
    const { simpleWaterService } = await import('./simpleWaterService');
    // Simple water service doesn't have getWaterLogs, so we'll return empty array for now
    // This is a legacy method that might not be needed
    return [];
  }

  async logWater(amount_ml: number): Promise<any> {
    const { simpleWaterService } = await import('./simpleWaterService');
    return simpleWaterService.logWater(amount_ml);
  }

  // Mood logging (delegated to moodService for consistency)
  async getMoodLogs(days: number = 7): Promise<any[]> {
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
