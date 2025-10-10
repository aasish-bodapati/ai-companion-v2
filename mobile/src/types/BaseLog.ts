/**
 * Base types and interfaces for all log entries
 * This provides a foundation for consistent log structures across the app
 */

// Base interface that all log types must extend
export interface BaseLog {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}

// Common parameters for log queries
export interface LogParams {
  skip?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
  page?: number;
  size?: number;
}

// Common pagination response structure
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  has_next: boolean;
  has_prev: boolean;
}

// Common log creation data
export interface BaseLogCreate {
  log_date?: string;
  notes?: string;
}

// Common log update data
export interface BaseLogUpdate {
  notes?: string;
}

// Common log statistics
export interface BaseLogStats {
  total_count: number;
  period_days: number;
  average_per_day: number;
  last_updated: string;
}

// Common search parameters
export interface SearchParams {
  query: string;
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}

// Common search result structure
export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
  has_more: boolean;
}

// Common form validation error
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Common API response structure
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  errors?: ValidationError[];
}

// Common error response
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}
