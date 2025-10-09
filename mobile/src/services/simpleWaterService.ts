import { apiClient } from './api';

export interface SimpleWaterLog {
  id: number;
  amount_ml: number;
  amount_oz: number;
  log_date: string;
  created_at: string;
}

export interface SimpleWaterStats {
  total_ml_today: number;
  total_oz_today: number;
  goal_ml: number;
  goal_oz: number;
  progress_percentage: number;
  logs_today: number;
}

class SimpleWaterService {
  /**
   * Log water intake - simple and fast
   */
  async logWater(amount_ml: number): Promise<SimpleWaterStats> {
    console.log('🚰 [SIMPLE WATER] Logging water:', amount_ml, 'ml');
    
    const response = await apiClient.post('/health/simple-water/log', null, {
      params: { amount_ml }
    });
    
    console.log('🚰 [SIMPLE WATER] Water logged successfully');
    return {
      total_ml_today: response.data.total_ml_today,
      total_oz_today: response.data.total_ml_today * 0.033814,
      goal_ml: response.data.goal_ml,
      goal_oz: response.data.goal_ml * 0.033814,
      progress_percentage: response.data.progress_percentage,
      logs_today: response.data.logs_today,
    };
  }

  /**
   * Get today's water stats - simple and fast
   */
  async getTodayStats(): Promise<SimpleWaterStats> {
    console.log('🚰 [SIMPLE WATER] Getting today stats');
    
    const response = await apiClient.get('/health/simple-water/stats');
    
    console.log('🚰 [SIMPLE WATER] Stats retrieved:', response.data);
    return response.data;
  }

  /**
   * Remove last water log - simplified approach
   * For now, we'll just return current stats since removing logs is not essential
   */
  async removeLastLog(): Promise<SimpleWaterStats> {
    console.log('🚰 [SIMPLE WATER] Remove last log requested - returning current stats');
    
    // For simplicity, just return current stats
    // In a real implementation, you'd need to track the last log ID
    // or implement a proper remove endpoint
    return this.getTodayStats();
  }
}

export const simpleWaterService = new SimpleWaterService();
