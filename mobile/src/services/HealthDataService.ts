import { dashboardService } from './dashboardService';
import { fitnessService } from './fitnessService';
import { nutritionService } from './nutritionService';
import { predictiveAnalyticsService } from './predictiveAnalyticsService';
import { smartNotificationsService } from './smartNotificationsService';

interface HealthDataSummary {
  user: any;
  dashboard: any;
  fitness: any;
  nutrition: any;
  analytics: any;
  notifications: any;
}

interface HealthDataOptions {
  includeAnalytics?: boolean;
  includeNotifications?: boolean;
  refreshCache?: boolean;
}

class HealthDataService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Get comprehensive health data
  async getHealthData(options: HealthDataOptions = {}): Promise<HealthDataSummary> {
    const {
      includeAnalytics = true,
      includeNotifications = false,
      refreshCache = false,
    } = options;

    const cacheKey = `health_data_${JSON.stringify(options)}`;
    
    if (!refreshCache && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      // Fetch core data in parallel
      const [dashboard, fitness, nutrition] = await Promise.all([
        this.getDashboardData(),
        this.getFitnessData(),
        this.getNutritionData(),
      ]);

      // Fetch optional data
      const analytics = includeAnalytics ? await this.getAnalyticsData() : null;
      const notifications = includeNotifications ? await this.getNotificationsData() : null;

      const healthData: HealthDataSummary = {
        user: null, // User data not available in dashboard
        dashboard,
        fitness,
        nutrition,
        analytics,
        notifications,
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: healthData,
        timestamp: Date.now(),
      });

      return healthData;
    } catch (error) {
      console.error('Error fetching health data:', error);
      throw new Error('Failed to fetch health data');
    }
  }

  // Get dashboard data
  private async getDashboardData() {
    try {
      const [summary, quickStats] = await Promise.all([
        dashboardService.getDashboardSummary(),
        dashboardService.getQuickStats(),
      ]);

      return {
        summary,
        quickStats,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return {
        summary: null,
        quickStats: null,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  // Get fitness data
  private async getFitnessData() {
    try {
      const [logs, stats, routines] = await Promise.all([
        fitnessService.getFitnessLogs({ period: 'week' }),
        fitnessService.getFitnessStats(),
        fitnessService.getRoutines(),
      ]);

      return {
        logs,
        stats,
        routines,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching fitness data:', error);
      return {
        logs: [],
        stats: null,
        routines: [],
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  // Get nutrition data
  private async getNutritionData() {
    try {
      const [logs, stats, goals] = await Promise.all([
        nutritionService.getNutritionLogs({ period: 'week' }),
        nutritionService.getNutritionStats(),
        nutritionService.getNutritionGoals(),
      ]);

      return {
        logs,
        stats,
        goals,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      return {
        logs: [],
        stats: null,
        goals: null,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  // Get analytics data
  private async getAnalyticsData() {
    try {
      const [insights, trends, patterns] = await Promise.all([
        predictiveAnalyticsService.getPredictiveInsights(),
        predictiveAnalyticsService.getTrendAnalysis('workouts'),
        predictiveAnalyticsService.getPatternInsights(),
      ]);

      return {
        insights,
        trends,
        patterns,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      return {
        insights: [],
        trends: null,
        patterns: [],
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  // Get notifications data
  private async getNotificationsData() {
    try {
      const [notifications, preferences] = await Promise.all([
        smartNotificationsService.getSmartNotifications(),
        smartNotificationsService.getPreferences(),
      ]);

      return {
        notifications,
        preferences,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching notifications data:', error);
      return {
        notifications: [],
        preferences: null,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  // Cache management
  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Clear specific cache entry
  clearCacheEntry(key: string): void {
    this.cache.delete(key);
  }

  // Get cache status
  getCacheStatus(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Batch operations
  async batchUpdate(updates: Array<{
    type: 'workout' | 'meal' | 'water' | 'mood';
    data: any;
  }>): Promise<void> {
    try {
      // Process updates in parallel
      const promises = updates.map(update => {
        switch (update.type) {
          case 'workout':
            return fitnessService.logWorkout(update.data);
          case 'meal':
            return nutritionService.logMeal(update.data);
          case 'water':
            return nutritionService.logWater(update.data);
          case 'mood':
            return fitnessService.logMood(update.data);
          default:
            throw new Error(`Unknown update type: ${update.type}`);
        }
      });

      await Promise.all(promises);
      
      // Clear cache to force refresh
      this.clearCache();
    } catch (error) {
      console.error('Error in batch update:', error);
      throw new Error('Failed to process batch update');
    }
  }

  // Health data validation
  validateHealthData(data: any): boolean {
    try {
      // Basic validation - can be expanded
      return (
        data &&
        typeof data === 'object' &&
        data.dashboard &&
        data.fitness &&
        data.nutrition
      );
    } catch (error) {
      return false;
    }
  }

  // Data export
  async exportHealthData(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const data = await this.getHealthData({ refreshCache: true });
      
      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      } else {
        // CSV export logic would go here
        return this.convertToCSV(data);
      }
    } catch (error) {
      console.error('Error exporting health data:', error);
      throw new Error('Failed to export health data');
    }
  }

  private convertToCSV(data: any): string {
    // Basic CSV conversion - can be enhanced
    const headers = ['Date', 'Type', 'Value', 'Unit'];
    const rows = [headers.join(',')];
    
    // Add data rows based on the health data structure
    // This is a simplified example
    rows.push('2024-01-01,Workout,30,minutes');
    rows.push('2024-01-01,Calories,2000,cal');
    
    return rows.join('\n');
  }
}

export const healthDataService = new HealthDataService();
export type { HealthDataSummary, HealthDataOptions };
