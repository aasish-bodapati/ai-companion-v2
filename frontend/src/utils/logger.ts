/**
 * Production-safe logging utility
 * Replaces console.log/error statements throughout the app
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';
  
  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }
  
  info(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, data);
    }
  }
  
  warn(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, data);
    }
    // In production, could send to error tracking service
  }
  
  error(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, data);
    }
    // In production, send to error tracking service
    this.sendToErrorTracking('error', message, data);
  }
  
  private sendToErrorTracking(level: LogLevel, message: string, data?: any): void {
    // Placeholder for production error tracking integration
    // Could integrate with Sentry, LogRocket, etc.
    if (!this.isDevelopment) {
      // Send to error tracking service
    }
  }
}

export const logger = new Logger();
export default logger;
