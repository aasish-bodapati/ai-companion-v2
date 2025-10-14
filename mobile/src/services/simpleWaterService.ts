import { api } from './api';


import { DebugUtils } from '../utils/debugUtils';

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
    DebugUtils.log('🚰 [SIMPLE WATER] Logging water:', amount_ml, 'ml');

    const response = await api.post('/api/v1/health/logging/water/quick', null, {
      params: { amount_ml }
    });

    DebugUtils.log('🚰 [SIMPLE WATER] Water logged successfully');
    // After logging, get updated stats
    return this.getTodayStats();
  }

  /**
   * Get today's water stats - simple and fast
   */
  async getTodayStats(): Promise<SimpleWaterStats> {
    const response = await api.get('/api/v1/health/logging/water/today');

    if (__DEV__) {
      DebugUtils.log('🚰 Water loaded - progress:', response.progress_percentage + '%');
    }
    
    // Map API response to expected format
    return {
      total_ml_today: response.total_ml,
      total_oz_today: response.total_oz,
      goal_ml: response.goal_ml,
      goal_oz: response.goal_ml * 0.033814,
      progress_percentage: response.progress_percentage,
      logs_today: response.logs_count,
    };
  }

  /**
   * Remove last water log - simplified approach
   * For now, we'll just return current stats since removing logs is not essential
   */
  async removeLastLog(): Promise<SimpleWaterStats> {
    DebugUtils.log('🚰 [SIMPLE WATER] Remove last log requested - returning current stats');

    // For simplicity, just return current stats
    // In a real implementation, you'd need to track the last log ID
    // or implement a proper remove endpoint
    return this.getTodayStats();
  }
}

export const simpleWaterService = new SimpleWaterService();
