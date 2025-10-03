import { AxiosResponse } from 'axios';
import { apiClient } from './api';

export abstract class BaseService {
  /**
   * Centralized API request handling with error management
   */
  protected async makeRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    errorContext: string
  ): Promise<T> {
    try {
      const response = await requestFn();
      return this.extractData(response);
    } catch (error) {
      this.handleError(error, errorContext);
      throw error;
    }
  }

  /**
   * Standardized data extraction from API responses
   */
  protected extractData<T>(response: AxiosResponse<T>): T {
    // Handle different response structures
    if (response.data && typeof response.data === 'object') {
      // Check for common response patterns
      if ('logs' in response.data && Array.isArray(response.data.logs)) {
        return response.data.logs as T;
      }
      if ('data' in response.data) {
        return response.data.data as T;
      }
    }
    return response.data || ([] as T);
  }

  /**
   * Centralized error handling and logging
   */
  protected handleError(error: any, context: string): void {
    // Silent error handling - no console logging to prevent Expo Go notifications
  }

  /**
   * Convert date string to ISO format for API calls
   */
  protected convertDateToISO(dateString: string, isEndOfDay: boolean = false): string {
    const timeString = isEndOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z';
    return new Date(dateString + timeString).toISOString();
  }

  /**
   * Get pagination parameters for API calls
   */
  protected getPaginationParams(params?: {
    page?: number;
    size?: number;
    start_date?: string;
    end_date?: string;
  }): any {
    const apiParams: any = { ...params };
    
    if (params?.start_date) {
      apiParams.start_date = this.convertDateToISO(params.start_date);
    }
    if (params?.end_date) {
      apiParams.end_date = this.convertDateToISO(params.end_date, true);
    }
    
    return apiParams;
  }

  /**
   * Calculate summary statistics from array of items
   */
  protected calculateSummary<T extends Record<string, any>>(
    items: T[],
    config: {
      totalField: keyof T;
      durationField?: keyof T;
      caloriesField?: keyof T;
    }
  ) {
    const total = items.length;
    const totalValue = items.reduce((sum, item) => sum + (Number(item[config.totalField as string]) || 0), 0);
    
    const summary: any = {
      total,
      total_value: totalValue,
      average_value: total > 0 ? Math.round(totalValue / total) : 0
    };

    if (config.durationField) {
      const totalDuration = items.reduce((sum, item) => sum + (Number(item[config.durationField as string]) || 0), 0);
      summary.total_duration = totalDuration;
      summary.average_duration = total > 0 ? Math.round(totalDuration / total) : 0;
    }

    if (config.caloriesField) {
      const totalCalories = items.reduce((sum, item) => sum + (Number(item[config.caloriesField as string]) || 0), 0);
      summary.total_calories = totalCalories;
      summary.average_calories = total > 0 ? Math.round(totalCalories / total) : 0;
    }

    return summary;
  }
}
