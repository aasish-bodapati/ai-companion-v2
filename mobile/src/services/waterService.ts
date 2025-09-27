import { apiClient } from './api';

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

export const waterService = {
  // Get water logs for a specific number of days
  async getWaterLogs(days: number = 7): Promise<WaterLog[]> {
    try {
      const response = await apiClient.get(`/health/water-logs/?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch water logs:', error);
      throw error;
    }
  },

  // Get today's water logs
  async getTodaysWaterLogs(): Promise<WaterLog[]> {
    try {
      const response = await apiClient.get('/health/water-logs/today');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch today\'s water logs:', error);
      throw error;
    }
  },

  // Get water intake statistics for today
  async getWaterStats(): Promise<WaterLogStats> {
    try {
      const response = await apiClient.get('/health/water-logs/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch water stats:', error);
      throw error;
    }
  },

  // Create a new water log entry
  async createWaterLog(waterLogData: WaterLogCreate): Promise<WaterLog> {
    try {
      const response = await apiClient.post('/health/water-logs/', waterLogData);
      return response.data;
    } catch (error) {
      console.error('Failed to create water log:', error);
      throw error;
    }
  },

  // Quick log water intake
  async quickLogWater(amount_ml: number): Promise<{ message: string; log_entry: WaterLog; stats: WaterLogStats }> {
    try {
      const response = await apiClient.post(`/health/water-logs/quick-log?amount_ml=${amount_ml}`);
      return response.data;
    } catch (error) {
      console.error('Failed to quick log water:', error);
      throw error;
    }
  },

  // Get a specific water log entry
  async getWaterLog(id: number): Promise<WaterLog> {
    try {
      const response = await apiClient.get(`/health/water-logs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch water log:', error);
      throw error;
    }
  },

  // Update a water log entry
  async updateWaterLog(id: number, updateData: Partial<WaterLogCreate>): Promise<WaterLog> {
    try {
      const response = await apiClient.put(`/health/water-logs/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Failed to update water log:', error);
      throw error;
    }
  },

  // Delete a water log entry
  async deleteWaterLog(id: number): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete(`/health/water-logs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete water log:', error);
      throw error;
    }
  },

  // Helper function to convert ml to oz
  mlToOz(ml: number): number {
    return ml * 0.033814;
  },

  // Helper function to convert oz to ml
  ozToMl(oz: number): number {
    return oz / 0.033814;
  },

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
  },
};
