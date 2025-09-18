/**
 * Main types export - All TypeScript types and interfaces
 */

// Health types removed - not used

// Chat types
// chat types removed - not used

// Common types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ErrorResponse {
  detail: string;
  error_code?: string;
  field_errors?: Record<string, string[]>;
}
