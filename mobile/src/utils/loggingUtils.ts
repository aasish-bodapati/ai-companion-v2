/**
 * Standardized logging utilities for consistent logging across components
 * Extracted from various components to reduce duplication
 */

import React from 'react';

// ============================================================================
// LOGGING LEVELS
// ============================================================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// ============================================================================
// LOGGING CONFIGURATION
// ============================================================================

const LOG_CONFIG = {
  level: __DEV__ ? LogLevel.DEBUG : LogLevel.WARN,
  enableConsole: __DEV__,
  enableTimestamps: __DEV__,
};

// ============================================================================
// CORE LOGGING FUNCTIONS
// ============================================================================

/**
 * Core logging function with level checking
 */
const log = (level: LogLevel, category: string, message: string, data?: unknown) => {
  if (level < LOG_CONFIG.level) return;
  
  const timestamp = LOG_CONFIG.enableTimestamps ? `[${new Date().toISOString()}] ` : '';
  const prefix = `${timestamp}[${category}]`;
  
  if (LOG_CONFIG.enableConsole) {
    switch (level) {
      case LogLevel.DEBUG:
        console.log(`${prefix} ${message}`, data || '');
        break;
      case LogLevel.INFO:
        console.info(`${prefix} ${message}`, data || '');
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${message}`, data || '');
        break;
      case LogLevel.ERROR:
        console.error(`${prefix} ${message}`, data || '');
        break;
    }
  }
};

// ============================================================================
// CATEGORY-SPECIFIC LOGGERS
// ============================================================================

/**
 * Component lifecycle logging
 */
export const componentLogger = {
  mount: (componentName: string, props?: unknown) => {
    log(LogLevel.DEBUG, 'COMPONENT', `🔄 ${componentName} mounted`, props);
  },
  
  unmount: (componentName: string) => {
    log(LogLevel.DEBUG, 'COMPONENT', `🔄 ${componentName} unmounted`);
  },
  
  render: (componentName: string, renderCount?: number) => {
    if (renderCount && renderCount > 1) {
      log(LogLevel.DEBUG, 'COMPONENT', `🔄 ${componentName} re-rendered (${renderCount})`);
    }
  },
  
  error: (componentName: string, error: Error, context?: unknown) => {
    log(LogLevel.ERROR, 'COMPONENT', `❌ ${componentName} error: ${error.message}`, { error, context });
  },
};

/**
 * API request/response logging
 */
export const apiLogger = {
  request: (method: string, url: string, data?: unknown) => {
    log(LogLevel.DEBUG, 'API', `📤 ${method} ${url}`, data);
  },
  
  response: (method: string, url: string, status: number, data?: unknown) => {
    const emoji = status >= 200 && status < 300 ? '✅' : '❌';
    log(LogLevel.DEBUG, 'API', `${emoji} ${method} ${url} - ${status}`, data);
  },
  
  error: (method: string, url: string, error: unknown) => {
    const errorMessage = error && typeof error === 'object' && 'message' in error ? 
      (error as Error).message : String(error);
    log(LogLevel.ERROR, 'API', `❌ ${method} ${url} failed: ${errorMessage}`, error);
  },
};

/**
 * User action logging
 */
export const actionLogger = {
  click: (element: string, context?: unknown) => {
    log(LogLevel.DEBUG, 'ACTION', `👆 Clicked ${element}`, context);
  },
  
  input: (field: string, value: unknown) => {
    log(LogLevel.DEBUG, 'ACTION', `⌨️ Input ${field}: ${value}`);
  },
  
  submit: (form: string, data?: unknown) => {
    log(LogLevel.DEBUG, 'ACTION', `📝 Submitted ${form}`, data);
  },
  
  navigation: (from: string, to: string) => {
    log(LogLevel.DEBUG, 'ACTION', `🧭 Navigated from ${from} to ${to}`);
  },
};

/**
 * Data loading logging
 */
export const dataLogger = {
  loading: (resource: string) => {
    log(LogLevel.DEBUG, 'DATA', `⏳ Loading ${resource}`);
  },
  
  loaded: (resource: string, count?: number) => {
    const countText = count !== undefined ? ` (${count} items)` : '';
    log(LogLevel.DEBUG, 'DATA', `✅ Loaded ${resource}${countText}`);
  },
  
  error: (resource: string, error: unknown) => {
    const errorMessage = error && typeof error === 'object' && 'message' in error ? 
      (error as Error).message : String(error);
    log(LogLevel.ERROR, 'DATA', `❌ Failed to load ${resource}: ${errorMessage}`);
  },
  
  refresh: (resource: string) => {
    log(LogLevel.DEBUG, 'DATA', `🔄 Refreshing ${resource}`);
  },
};

/**
 * Performance logging
 */
export const performanceLogger = {
  start: (operation: string) => {
    log(LogLevel.DEBUG, 'PERF', `⏱️ Started ${operation}`);
  },
  
  end: (operation: string, duration: number) => {
    log(LogLevel.DEBUG, 'PERF', `⏱️ Completed ${operation} in ${duration}ms`);
  },
  
  slow: (operation: string, duration: number, threshold: number = 1000) => {
    if (duration > threshold) {
      log(LogLevel.WARN, 'PERF', `🐌 Slow operation ${operation}: ${duration}ms (threshold: ${threshold}ms)`);
    }
  },
};

/**
 * State management logging
 */
export const stateLogger = {
  update: (store: string, action: string, data?: unknown) => {
    log(LogLevel.DEBUG, 'STATE', `🔄 ${store}: ${action}`, data);
  },
  
  error: (store: string, action: string, error: unknown) => {
    const errorMessage = error && typeof error === 'object' && 'message' in error ? 
      (error as Error).message : String(error);
    log(LogLevel.ERROR, 'STATE', `❌ ${store}: ${action} failed: ${errorMessage}`);
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a scoped logger for a specific component
 */
export const createScopedLogger = (componentName: string) => ({
  debug: (message: string, data?: unknown) => log(LogLevel.DEBUG, componentName, message, data),
  info: (message: string, data?: unknown) => log(LogLevel.INFO, componentName, message, data),
  warn: (message: string, data?: unknown) => log(LogLevel.WARN, componentName, message, data),
  error: (message: string, data?: unknown) => log(LogLevel.ERROR, componentName, message, data),
});

/**
 * Log function execution time
 */
export const logExecutionTime = async <T>(
  operation: string,
  fn: () => Promise<T> | T
): Promise<T> => {
  const start = Date.now();
  performanceLogger.start(operation);
  
  try {
    const result = await fn();
    const duration = Date.now() - start;
    performanceLogger.end(operation, duration);
    performanceLogger.slow(operation, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    performanceLogger.end(operation, duration);
    log(LogLevel.ERROR, 'PERF', `❌ ${operation} failed after ${duration}ms`, error);
    throw error;
  }
};

/**
 * Log component lifecycle with automatic cleanup
 */
export const withLifecycleLogging = <T extends React.ComponentType<any>>(
  Component: T,
  componentName: string
): T => {
  const WrappedComponent = (props: unknown) => {
    React.useEffect(() => {
      componentLogger.mount(componentName, props);
      return () => componentLogger.unmount(componentName);
    }, [componentName, props]);
    
    return React.createElement(Component, props);
  };
  
  WrappedComponent.displayName = `withLifecycleLogging(${componentName})`;
  return WrappedComponent as T;
};

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Hook for logging component renders
 */
export const useRenderLogger = (componentName: string, props?: unknown) => {
  const renderCount = React.useRef(0);
  renderCount.current += 1;
  
  React.useEffect(() => {
    componentLogger.render(componentName, renderCount.current);
  });
  
  React.useEffect(() => {
    if (props) {
      log(LogLevel.DEBUG, componentName, 'Props changed', props);
    }
  }, [componentName, props]);
};

/**
 * Hook for logging async operations
 */
export const useAsyncLogger = (operation: string) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<any>(null);
  
  const execute = React.useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await logExecutionTime(operation, fn);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [operation]);
  
  return { execute, isLoading, error };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  componentLogger,
  apiLogger,
  actionLogger,
  dataLogger,
  performanceLogger,
  stateLogger,
  createScopedLogger,
  logExecutionTime,
  withLifecycleLogging,
  useRenderLogger,
  useAsyncLogger,
};
