/**
 * Crash reporting utilities
 */

import { Platform, Alert } from 'react-native';
import { DebugUtils } from './debugUtils';
import { performanceMonitor } from './performanceMonitoring';

export interface CrashReport {
  id: string;
  timestamp: number;
  error: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  context: {
    userId?: string;
    sessionId: string;
    screen?: string;
    action?: string;
    metadata?: Record<string, any>;
  };
  device: {
    platform: string;
    version: string;
    model?: string;
    memory?: number;
    screenWidth: number;
    screenHeight: number;
  };
  app: {
    version: string;
    buildNumber: string;
    bundleId: string;
  };
  performance?: {
    memoryUsage?: number;
    fps?: number;
    lastAction?: string;
  };
}

export interface CrashReportingConfig {
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  enableUserFeedback: boolean;
  enablePerformanceData: boolean;
}

class CrashReporter {
  private static instance: CrashReporter;
  private config: CrashReportingConfig;
  private crashQueue: CrashReport[] = [];
  private isFlushing = false;
  private flushTimer: NodeJS.Timeout | null = null;
  private retryCount = 0;

  private constructor() {
    this.config = {
      enabled: !__DEV__, // Disable in development
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      maxRetries: 3,
      enableUserFeedback: true,
      enablePerformanceData: true,
    };

    this.setupGlobalErrorHandlers();
    this.startFlushTimer();
  }

  static getInstance(): CrashReporter {
    if (!CrashReporter.instance) {
      CrashReporter.instance = new CrashReporter();
    }
    return CrashReporter.instance;
  }

  /**
   * Configure crash reporting
   */
  configure(config: Partial<CrashReportingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    if (!this.config.enabled) return;

    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.reportError(
          new Error(event.reason),
          'Unhandled Promise Rejection',
          { reason: event.reason }
        );
      });
    }

    // Handle JavaScript errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.reportError(
          event.error || new Error(event.message),
          'JavaScript Error',
          { filename: event.filename, lineno: event.lineno, colno: event.colno }
        );
      });
    }
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Report an error
   */
  reportError(
    error: Error,
    context?: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.config.enabled) {
      DebugUtils.error('CrashReporter: Error reported but reporting is disabled', error);
      return;
    }

    const crashReport = this.createCrashReport(error, context, metadata);
    this.crashQueue.push(crashReport);

    // Log in development
    if (__DEV__) {
      DebugUtils.error('CrashReporter: Error reported', crashReport);
    }

    // Show user feedback if enabled
    if (this.config.enableUserFeedback) {
      this.showUserFeedback();
    }

    // Flush immediately for critical errors
    if (this.isCriticalError(error)) {
      this.flush();
    }
  }

  /**
   * Create crash report
   */
  private createCrashReport(
    error: Error,
    context?: string,
    metadata?: Record<string, any>
  ): CrashReport {
    const performanceData = this.config.enablePerformanceData
      ? this.getPerformanceData()
      : undefined;

    return {
      id: this.generateCrashId(),
      timestamp: Date.now(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: this.getErrorCode(error),
      },
      context: {
        sessionId: performanceMonitor.getPerformanceReport().sessionId,
        screen: context,
        action: metadata?.action,
        metadata,
      },
      device: this.getDeviceInfo(),
      app: this.getAppInfo(),
      performance: performanceData,
    };
  }

  /**
   * Generate unique crash ID
   */
  private generateCrashId(): string {
    return `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error code
   */
  private getErrorCode(error: Error): string {
    if (error.name === 'NetworkError') return 'NETWORK_ERROR';
    if (error.name === 'TimeoutError') return 'TIMEOUT_ERROR';
    if (error.message.includes('unauthorized')) return 'UNAUTHORIZED_ERROR';
    if (error.message.includes('forbidden')) return 'FORBIDDEN_ERROR';
    if (error.message.includes('not found')) return 'NOT_FOUND_ERROR';
    if (error.message.includes('validation')) return 'VALIDATION_ERROR';
    return 'UNKNOWN_ERROR';
  }

  /**
   * Check if error is critical
   */
  private isCriticalError(error: Error): boolean {
    const criticalErrors = [
      'OutOfMemoryError',
      'StackOverflowError',
      'TypeError',
      'ReferenceError',
    ];
    return criticalErrors.includes(error.name);
  }

  /**
   * Get device information
   */
  private getDeviceInfo() {
    const { width, height, scale } = require('react-native').Dimensions.get('window');
    return {
      platform: Platform.OS,
      version: Platform.Version.toString(),
      screenWidth: width,
      screenHeight: height,
      pixelRatio: scale,
    };
  }

  /**
   * Get app information
   */
  private getAppInfo() {
    return {
      version: '1.0.0', // Would come from app config
      buildNumber: '1', // Would come from app config
      bundleId: 'com.healthlog.app', // Would come from app config
    };
  }

  /**
   * Get performance data
   */
  private getPerformanceData() {
    const report = performanceMonitor.getPerformanceReport();
    const memoryMetric = performanceMonitor.getLatestMetric('memory_used');
    const fpsMetric = performanceMonitor.getLatestMetric('fps');

    return {
      memoryUsage: memoryMetric?.value,
      fps: fpsMetric?.value,
      lastAction: 'unknown', // Would track last user action
    };
  }

  /**
   * Show user feedback
   */
  private showUserFeedback(): void {
    Alert.alert(
      'Something went wrong',
      'We\'ve detected an issue and are working to fix it. Would you like to send us more details?',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Send details', onPress: () => this.flush() },
      ]
    );
  }

  /**
   * Flush crash reports
   */
  async flush(): Promise<void> {
    if (this.isFlushing || this.crashQueue.length === 0) {
      return;
    }

    this.isFlushing = true;

    try {
      const reports = [...this.crashQueue];
      this.crashQueue = [];

      if (this.config.endpoint) {
        await this.sendToEndpoint(reports);
      } else {
        // In development, just log the reports
        DebugUtils.log('CrashReporter: Would send reports', reports);
      }

      this.retryCount = 0;
    } catch (error) {
      DebugUtils.error('CrashReporter: Failed to send reports', error);
      
      // Retry logic
      if (this.retryCount < this.config.maxRetries) {
        this.retryCount++;
        this.crashQueue.unshift(...this.crashQueue); // Put reports back in queue
        setTimeout(() => this.flush(), 5000 * this.retryCount); // Exponential backoff
      }
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Send reports to endpoint
   */
  private async sendToEndpoint(reports: CrashReport[]): Promise<void> {
    // This would integrate with your crash reporting service
    // For now, just simulate the request
    DebugUtils.log('CrashReporter: Sending reports to endpoint', {
      endpoint: this.config.endpoint,
      count: reports.length,
    });

    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Get crash statistics
   */
  getCrashStats() {
    return {
      totalCrashes: this.crashQueue.length,
      errorTypes: this.crashQueue.reduce((acc, report) => {
        const type = report.error.name;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Clear crash queue
   */
  clearCrashQueue(): void {
    this.crashQueue = [];
  }

  /**
   * Enable/disable crash reporting
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }
}

// Export singleton instance
export const crashReporter = CrashReporter.getInstance();

// Export convenience functions
export const reportError = (
  error: Error,
  context?: string,
  metadata?: Record<string, any>
) => crashReporter.reportError(error, context, metadata);

export const configureCrashReporting = (config: Partial<CrashReportingConfig>) =>
  crashReporter.configure(config);

// Export types
export { CrashReport, CrashReportingConfig };
