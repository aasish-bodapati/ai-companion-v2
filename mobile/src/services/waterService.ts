import { apiClient } from './api';
import { BaseService } from './BaseService';

export interface WaterLog {
  id: number;
  user_id: number;
  amount_ml: number;
  amount_oz: number;
  log_type: 'manual' | 'goal' | 'reminder';
  notes?: string;
  log_date: string;
  created_at: string;
  updated_at: string;
}

export interface WaterLogCreate {
  amount_ml: number;
  amount_oz?: number;
  log_type?: 'manual' | 'goal' | 'reminder';
  notes?: string;
  log_date?: string;
}

export interface WaterLogStats {
  total_ml_today: number;
  total_oz_today: number;
  goal_ml: number;
  goal_oz: number;
  progress_percentage: number;
  logs_today: number;
  average_per_log: number;
}

export interface WaterLogSummary {
  date: string;
  total_ml: number;
  total_oz: number;
  logs_count: number;
  goal_achieved: boolean;
}

class WaterService extends BaseService {
  // Get water logs for a specific number of days
  async getWaterLogs(days: number = 7): Promise<WaterLog[]> {
    return this.makeRequest(
      () => apiClient.get(`/health/water-logs/?days=${days}`),
      'WATER SERVICE - getWaterLogs'
    );
  }

  // Get today's water logs
  async getTodaysWaterLogs(): Promise<WaterLog[]> {
    return this.makeRequest(
      () => apiClient.get('/health/water-logs/today'),
      'WATER SERVICE - getTodaysWaterLogs'
    );
  }

  // Get water intake statistics for today
  async getWaterStats(): Promise<WaterLogStats> {
    return this.makeRequest(
      () => apiClient.get('/health/water-logs/stats'),
      'WATER SERVICE - getWaterStats'
    );
  }

  // Create a new water log entry
  async createWaterLog(waterLogData: WaterLogCreate): Promise<WaterLog> {
    return this.makeRequest(
      () => apiClient.post('/health/water-logs/', waterLogData),
      'WATER SERVICE - createWaterLog'
    );
  }

  // Quick log water intake
  async quickLogWater(amount_ml: number): Promise<{ message: string; log_entry: WaterLog; stats: WaterLogStats }> {
    return this.makeRequest(
      () => apiClient.post(`/health/water-logs/quick-log?amount_ml=${amount_ml}`),
      'WATER SERVICE - quickLogWater'
    );
  }

  // Get a specific water log entry
  async getWaterLog(id: number): Promise<WaterLog> {
    return this.makeRequest(
      () => apiClient.get(`/health/water-logs/${id}`),
      'WATER SERVICE - getWaterLog'
    );
  }

  // Update a water log entry
  async updateWaterLog(id: number, updateData: Partial<WaterLogCreate>): Promise<WaterLog> {
    return this.makeRequest(
      () => apiClient.put(`/health/water-logs/${id}`, updateData),
      'WATER SERVICE - updateWaterLog'
    );
  }

  // Delete a water log entry
  async deleteWaterLog(id: number): Promise<{ message: string }> {
    return this.makeRequest(
      () => apiClient.delete(`/health/water-logs/${id}`),
      'WATER SERVICE - deleteWaterLog'
    );
  }

  // Helper function to convert ml to oz
  mlToOz(ml: number): number {
    return ml * 0.033814;
  }

  // Helper function to convert oz to ml
  ozToMl(oz: number): number {
    return oz / 0.033814;
  }

  // Get common water amounts in ml
  getCommonAmounts(): { label: string; ml: number; oz: number }[] {
    return [
      { label: 'Small Glass', ml: 150, oz: 5.1 },
      { label: 'Medium Glass', ml: 200, oz: 6.8 },
      { label: 'Large Glass', ml: 250, oz: 8.5 },
      { label: 'Water Bottle', ml: 500, oz: 16.9 },
      { label: 'Large Bottle', ml: 750, oz: 25.4 },
      { label: '1 Liter', ml: 1000, oz: 33.8 },
    ];
  }
}

// Export singleton instance to maintain backward compatibility
export const waterService = new WaterService();
