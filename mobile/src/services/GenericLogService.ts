import { apiClient } from './api';
import { BaseService } from './BaseService';
import { BaseLog, LogParams, PaginatedResponse, BaseLogCreate, BaseLogUpdate } from '../types/BaseLog';

/**
 * Generic service base class for all log services
 * Provides common CRUD operations and reduces code duplication
 */
export abstract class GenericLogService<T extends BaseLog> extends BaseService {
  protected abstract endpoint: string;

  /**
   * Get logs with optional filtering and pagination
   */
  async getLogs(params?: LogParams): Promise<T[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const url = queryParams.toString() ? `${this.endpoint}?${queryParams.toString()}` : this.endpoint;
    
    return this.makeRequest(
      () => apiClient.get(url),
      `${this.constructor.name} - getLogs`
    );
  }

  /**
   * Get logs with pagination
   */
  async getLogsPaginated(params?: LogParams): Promise<PaginatedResponse<T>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const url = queryParams.toString() ? `${this.endpoint}/paginated?${queryParams.toString()}` : `${this.endpoint}/paginated`;
    
    return this.makeRequest(
      () => apiClient.get(url),
      `${this.constructor.name} - getLogsPaginated`
    );
  }

  /**
   * Get a specific log by ID
   */
  async getLog(id: number): Promise<T> {
    return this.makeRequest(
      () => apiClient.get(`${this.endpoint}/${id}`),
      `${this.constructor.name} - getLog`
    );
  }

  /**
   * Create a new log entry
   */
  async createLog(data: BaseLogCreate): Promise<T> {
    return this.makeRequest(
      () => apiClient.post(this.endpoint, data),
      `${this.constructor.name} - createLog`
    );
  }

  /**
   * Update an existing log entry
   */
  async updateLog(id: number, data: BaseLogUpdate): Promise<T> {
    return this.makeRequest(
      () => apiClient.put(`${this.endpoint}/${id}`, data),
      `${this.constructor.name} - updateLog`
    );
  }

  /**
   * Delete a log entry
   */
  async deleteLog(id: number): Promise<{ message: string }> {
    return this.makeRequest(
      () => apiClient.delete(`${this.endpoint}/${id}`),
      `${this.constructor.name} - deleteLog`
    );
  }

  /**
   * Get today's logs
   */
  async getTodaysLogs(): Promise<T[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getLogs({
      start_date: today,
      end_date: today,
    });
  }

  /**
   * Get logs for a specific date range
   */
  async getLogsByDateRange(startDate: string, endDate: string, limit?: number): Promise<T[]> {
    return this.getLogs({
      start_date: startDate,
      end_date: endDate,
      limit,
    });
  }

  /**
   * Get recent logs (last N entries)
   */
  async getRecentLogs(limit: number = 10): Promise<T[]> {
    return this.getLogs({ limit });
  }

  /**
   * Search logs (if the endpoint supports it)
   */
  async searchLogs(query: string, params?: LogParams): Promise<T[]> {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);

    return this.makeRequest(
      () => apiClient.get(`${this.endpoint}/search?${searchParams.toString()}`),
      `${this.constructor.name} - searchLogs`
    );
  }

  /**
   * Get logs statistics
   */
  async getLogsStats(params?: { start_date?: string; end_date?: string }): Promise<{
    total_count: number;
    period_days: number;
    average_per_day: number;
    last_updated: string;
  }> {
    const queryParams = new URLSearchParams();
    
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const url = queryParams.toString() ? `${this.endpoint}/stats?${queryParams.toString()}` : `${this.endpoint}/stats`;
    
    return this.makeRequest(
      () => apiClient.get(url),
      `${this.constructor.name} - getLogsStats`
    );
  }

  /**
   * Bulk create logs
   */
  async bulkCreateLogs(logs: BaseLogCreate[]): Promise<T[]> {
    return this.makeRequest(
      () => apiClient.post(`${this.endpoint}/bulk`, { logs }),
      `${this.constructor.name} - bulkCreateLogs`
    );
  }

  /**
   * Bulk update logs
   */
  async bulkUpdateLogs(updates: Array<{ id: number; data: BaseLogUpdate }>): Promise<T[]> {
    return this.makeRequest(
      () => apiClient.put(`${this.endpoint}/bulk`, { updates }),
      `${this.constructor.name} - bulkUpdateLogs`
    );
  }

  /**
   * Bulk delete logs
   */
  async bulkDeleteLogs(ids: number[]): Promise<{ message: string; deleted_count: number }> {
    return this.makeRequest(
      () => apiClient.delete(`${this.endpoint}/bulk`, { data: { ids } }),
      `${this.constructor.name} - bulkDeleteLogs`
    );
  }
}
