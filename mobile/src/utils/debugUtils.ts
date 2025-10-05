/**
 * Debug utilities for safe console logging
 * Replaces direct console.log usage with controlled logging
 */

export const DebugUtils = {
  isDebugMode: __DEV__, // Only log in development
  
  log: (message: string, data?: any) => {
    if (DebugUtils.isDebugMode) {
      console.log(`[DEBUG] ${message}`, data);
    }
  },
  
  warn: (message: string, data?: any) => {
    if (DebugUtils.isDebugMode) {
      console.warn(`[WARN] ${message}`, data);
    }
  },
  
  error: (message: string, data?: any) => {
    if (DebugUtils.isDebugMode) {
      console.error(`[ERROR] ${message}`, data);
    }
  },
  
  info: (message: string, data?: any) => {
    if (DebugUtils.isDebugMode) {
      console.info(`[INFO] ${message}`, data);
    }
  },
  
  // Group related logs together
  group: (label: string, fn: () => void) => {
    if (DebugUtils.isDebugMode) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  },
  
  // Time operations
  time: (label: string) => {
    if (DebugUtils.isDebugMode) {
      console.time(label);
    }
  },
  
  timeEnd: (label: string) => {
    if (DebugUtils.isDebugMode) {
      console.timeEnd(label);
    }
  },
};

// Export individual functions for convenience
export const { log, warn, error, info, group, time, timeEnd } = DebugUtils;
