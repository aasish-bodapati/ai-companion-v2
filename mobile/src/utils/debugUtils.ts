// Debug utilities for development and production

/**
 * Debug Utilities
 * Centralized logging and debugging utilities for development and production
 */

// Debug configuration
const DEBUG_CONFIG = {
  enabled: __DEV__, // Enable in development mode
  logLevel: 'warn' as 'debug' | 'info' | 'warn' | 'error', // Only show warnings and errors by default
  showTimestamps: true,
  showCaller: false, // Reduce noise by hiding caller info
};

// Log levels
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Get current log level
const getCurrentLogLevel = (): number => {
  return LOG_LEVELS[DEBUG_CONFIG.logLevel];
};

// Format log message
const formatMessage = (level: string, message: string, ...args: any[]): string => {
  let formatted = `[${level.toUpperCase()}]`;
  
  if (DEBUG_CONFIG.showTimestamps) {
    formatted += ` ${new Date().toISOString()}`;
  }
  
  if (DEBUG_CONFIG.showCaller) {
    const stack = new Error().stack;
    const caller = stack?.split('\n')[3]?.trim() || 'unknown';
    formatted += ` ${caller}`;
  }
  
  formatted += ` ${message}`;
  
  if (args.length > 0) {
    formatted += ` ${args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')}`;
  }
  
  return formatted;
};

// Core logging functions
export const DebugUtils = {
  /**
   * Debug level logging
   */
  debug: (message: string, ...args: any[]): void => {
    if (!DEBUG_CONFIG.enabled || getCurrentLogLevel() > LOG_LEVELS.debug) return;
    console.log(formatMessage('debug', message, ...args));
  },

  /**
   * Info level logging
   */
  log: (message: string, ...args: any[]): void => {
    if (!DEBUG_CONFIG.enabled || getCurrentLogLevel() > LOG_LEVELS.info) return;
    console.log(formatMessage('info', message, ...args));
  },

  /**
   * Info level logging (alias for log)
   */
  info: (message: string, ...args: any[]): void => {
    DebugUtils.log(message, ...args);
  },

  /**
   * Warning level logging
   */
  warn: (message: string, ...args: any[]): void => {
    if (!DEBUG_CONFIG.enabled || getCurrentLogLevel() > LOG_LEVELS.warn) return;
    console.warn(formatMessage('warn', message, ...args));
  },

  /**
   * Error level logging
   */
  error: (message: string, ...args: any[]): void => {
    if (!DEBUG_CONFIG.enabled || getCurrentLogLevel() > LOG_LEVELS.error) return;
    console.error(formatMessage('error', message, ...args));
  },

  /**
   * Group logging for related messages
   */
  group: (label: string): void => {
    if (!DEBUG_CONFIG.enabled) return;
    console.group(label);
  },

  /**
   * End group logging
   */
  groupEnd: (): void => {
    if (!DEBUG_CONFIG.enabled) return;
    console.groupEnd();
  },

  /**
   * Time measurement
   */
  time: (label: string): void => {
    if (!DEBUG_CONFIG.enabled) return;
    console.time(label);
  },

  /**
   * End time measurement
   */
  timeEnd: (label: string): void => {
    if (!DEBUG_CONFIG.enabled) return;
    console.timeEnd(label);
  },

  /**
   * Table logging for objects/arrays
   */
  table: (data: any): void => {
    if (!DEBUG_CONFIG.enabled) return;
    console.table(data);
  },

  /**
   * Assert logging
   */
  assert: (condition: boolean, message: string): void => {
    if (!DEBUG_CONFIG.enabled) return;
    console.assert(condition, message);
  },

  /**
   * Trace logging with stack trace
   */
  trace: (message: string, ...args: any[]): void => {
    if (!DEBUG_CONFIG.enabled) return;
    console.trace(formatMessage('trace', message, ...args));
  },

  /**
   * Performance measurement
   */
  measure: (name: string, fn: () => void): void => {
    if (!DEBUG_CONFIG.enabled) {
      fn();
      return;
    }
    
    const start = performance.now();
    fn();
    const end = performance.now();
    DebugUtils.log(`Performance [${name}]: ${(end - start).toFixed(2)}ms`);
  },

  /**
   * Memory usage logging
   */
  memory: (): void => {
    if (!DEBUG_CONFIG.enabled) return;
    if (performance.memory) {
      const memory = performance.memory;
      DebugUtils.log('Memory Usage:', {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`,
      });
    }
  },

  /**
   * Network request logging
   */
  network: (method: string, url: string, status?: number, duration?: number): void => {
    if (!DEBUG_CONFIG.enabled) return;
    const statusColor = status && status >= 400 ? '🔴' : status && status >= 300 ? '🟡' : '🟢';
    const durationText = duration ? ` (${duration}ms)` : '';
    DebugUtils.log(`${statusColor} ${method.toUpperCase()} ${url} ${status || ''}${durationText}`);
  },

  /**
   * State logging for debugging
   */
  state: (componentName: string, state: any): void => {
    if (!DEBUG_CONFIG.enabled) return;
    DebugUtils.log(`State [${componentName}]:`, state);
  },

  /**
   * Props logging for debugging
   */
  props: (componentName: string, props: any): void => {
    if (!DEBUG_CONFIG.enabled) return;
    DebugUtils.log(`Props [${componentName}]:`, props);
  },

  /**
   * API response logging
   */
  api: (endpoint: string, method: string, response: any, error?: any): void => {
    if (!DEBUG_CONFIG.enabled) return;
    if (error) {
      DebugUtils.error(`API Error [${method} ${endpoint}]:`, error);
    } else {
      DebugUtils.log(`API Success [${method} ${endpoint}]:`, response);
    }
  },

  /**
   * User action logging
   */
  action: (action: string, data?: any): void => {
    if (!DEBUG_CONFIG.enabled) return;
    DebugUtils.log(`User Action: ${action}`, data);
  },

  /**
   * Feature flag logging
   */
  feature: (feature: string, enabled: boolean): void => {
    if (!DEBUG_CONFIG.enabled) return;
    DebugUtils.log(`Feature Flag [${feature}]: ${enabled ? '✅' : '❌'}`);
  },

  /**
   * Configuration
   */
  config: DEBUG_CONFIG,

  /**
   * Set log level
   */
  setLogLevel: (level: 'debug' | 'info' | 'warn' | 'error'): void => {
    DEBUG_CONFIG.logLevel = level;
  },

  /**
   * Enable/disable debugging
   */
  setEnabled: (enabled: boolean): void => {
    DEBUG_CONFIG.enabled = enabled;
  },
};

// Export default
export default DebugUtils;