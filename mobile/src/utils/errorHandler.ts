/**
 * Global error handling utilities
 */

import { Alert } from 'react-native';
import { DebugUtils } from './debugUtils';

export interface ErrorInfo {
  componentStack?: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

export interface AppError extends Error {
  code?: string;
  userMessage?: string;
  isRetryable?: boolean;
  context?: Record<string, unknown>;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: AppError[] = [];
  private isReporting = false;

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(new Error(event.reason), 'Unhandled Promise Rejection');
      });
    }

    // Handle JavaScript errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.handleError(event.error || new Error(event.message), 'JavaScript Error');
      });
    }
  }

  /**
   * Handle application errors
   */
  handleError = (error: Error | AppError, context?: string, errorInfo?: ErrorInfo) => {
    const appError: AppError = this.normalizeError(error);
    
    // Add context information
    if (context) {
      appError.context = { ...appError.context, context };
    }
    if (errorInfo) {
      appError.context = { ...appError.context, errorInfo };
    }

    // Log error
    this.logError(appError);

    // Add to error queue
    this.errorQueue.push(appError);

    // Report error if not already reporting
    if (!this.isReporting) {
      this.reportErrors();
    }

    // Show user-friendly error message
    this.showUserError(appError);
  };

  /**
   * Normalize error to AppError format
   */
  private normalizeError(error: Error | AppError): AppError {
    if ('code' in error && 'userMessage' in error) {
      return error as AppError;
    }

    return {
      ...error,
      code: this.getErrorCode(error),
      userMessage: this.getUserMessage(error),
      isRetryable: this.isRetryableError(error),
      context: {},
    };
  }

  /**
   * Get error code based on error type
   */
  private getErrorCode(error: Error): string {
    if (error.name === 'NetworkError' || error.message.includes('network')) {
      return 'NETWORK_ERROR';
    }
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return 'TIMEOUT_ERROR';
    }
    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return 'UNAUTHORIZED_ERROR';
    }
    if (error.message.includes('forbidden') || error.message.includes('403')) {
      return 'FORBIDDEN_ERROR';
    }
    if (error.message.includes('not found') || error.message.includes('404')) {
      return 'NOT_FOUND_ERROR';
    }
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  /**
   * Get user-friendly error message
   */
  private getUserMessage(error: Error): string {
    const code = this.getErrorCode(error);

    switch (code) {
      case 'NETWORK_ERROR':
        return 'Please check your internet connection and try again.';
      case 'TIMEOUT_ERROR':
        return 'The request took too long. Please try again.';
      case 'UNAUTHORIZED_ERROR':
        return 'Please log in again to continue.';
      case 'FORBIDDEN_ERROR':
        return 'You don\'t have permission to perform this action.';
      case 'NOT_FOUND_ERROR':
        return 'The requested item was not found.';
      case 'VALIDATION_ERROR':
        return 'Please check your input and try again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const code = this.getErrorCode(error);
    return ['NETWORK_ERROR', 'TIMEOUT_ERROR'].includes(code);
  }

  /**
   * Log error for debugging
   */
  private logError(error: AppError) {
    DebugUtils.error('ErrorHandler:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
      context: error.context,
    });
  }

  /**
   * Show user-friendly error message
   */
  private showUserError(error: AppError) {
    const title = 'Error';
    const message = error.userMessage || 'Something went wrong. Please try again.';
    const buttons = [
      { text: 'OK', style: 'default' as const },
    ];

    // Add retry button for retryable errors
    if (error.isRetryable) {
      buttons.unshift({
        text: 'Retry',
        style: 'default' as const,
        onPress: () => this.retryLastAction(),
      });
    }

    Alert.alert(title, message, buttons);
  }

  /**
   * Retry last action (placeholder implementation)
   */
  private retryLastAction() {
    // TODO: Implement retry logic based on the last action
    DebugUtils.log('Retrying last action...');
  }

  /**
   * Report errors to crash reporting service
   */
  private async reportErrors() {
    if (this.isReporting || this.errorQueue.length === 0) {
      return;
    }

    this.isReporting = true;

    try {
      const errors = [...this.errorQueue];
      this.errorQueue = [];

      // In production, send to crash reporting service
      if (!__DEV__) {
        await this.sendToCrashReportingService(errors);
      }

      DebugUtils.log(`Reported ${errors.length} errors`);
    } catch (error) {
      DebugUtils.error('Failed to report errors:', error);
    } finally {
      this.isReporting = false;
    }
  }

  /**
   * Send errors to crash reporting service
   */
  private async sendToCrashReportingService(errors: AppError[]) {
    // TODO: Integrate with crash reporting service (e.g., Sentry, Bugsnag)
    // For now, just log them
    DebugUtils.log('Sending errors to crash reporting service:', errors);
  }

  /**
   * Clear error queue
   */
  clearErrors() {
    this.errorQueue = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    return {
      totalErrors: this.errorQueue.length,
      errorTypes: this.errorQueue.reduce((acc, error) => {
        acc[error.code || 'UNKNOWN'] = (acc[error.code || 'UNKNOWN'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Export convenience functions
export const handleError = (error: Error | AppError, context?: string, errorInfo?: ErrorInfo) => {
  errorHandler.handleError(error, context, errorInfo);
};

export const createAppError = (
  message: string,
  code?: string,
  userMessage?: string,
  isRetryable?: boolean,
  context?: Record<string, any>
): AppError => ({
  name: 'AppError',
  message,
  code,
  userMessage,
  isRetryable,
  context,
});

// Export error types for use in components
export { AppError, ErrorInfo };
