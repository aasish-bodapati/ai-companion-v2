/**
 * Performance utilities for React Native optimization
 */

import React from 'react';
import { InteractionManager, Platform } from 'react-native';

// Performance measurement utilities
export const performanceUtils = {
  /**
   * Run function after interactions complete
   */
  runAfterInteractions: (callback: () => void) => {
    InteractionManager.runAfterInteractions(callback);
  },

  /**
   * Check if device is low-end based on platform and memory
   */
  isLowEndDevice: (): boolean => {
    if (Platform.OS === 'android') {
      // Android-specific checks
      return Platform.Version < 26; // API level 26 = Android 8.0
    }
    return false; // iOS devices are generally well-optimized
  },

  /**
   * List performance optimizations
   */
  list: {
    getBatchSize: (): number => {
      const isLowEnd = performanceUtils.isLowEndDevice();
      return isLowEnd ? 5 : 10;
    },

    getWindowSize: (): number => {
      const isLowEnd = performanceUtils.isLowEndDevice();
      return isLowEnd ? 5 : 10;
    },

    getInitialNumToRender: (): number => {
      const isLowEnd = performanceUtils.isLowEndDevice();
      return isLowEnd ? 5 : 10;
    },
  },

  /**
   * Debounce function calls
   */
  debounce: <T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Throttle function calls
   */
  throttle: <T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
};

// Component optimization utilities
export const componentOptimization = {
  /**
   * Check if list item should be rendered (basic visibility check)
   */
  optimizeListItem: (item: unknown, index: number, data: unknown[]): boolean => {
    // Simple optimization - render all items for now
    // In a real implementation, this would check viewport visibility
    return true;
  },

  /**
   * Memoize expensive calculations
   */
  memoize: <T extends (...args: unknown[]) => unknown>(fn: T): T => {
    const cache = new Map();
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },

  /**
   * Create optimized key extractor for lists
   */
  createKeyExtractor: <T>(idField: string = 'id') => {
    return (item: T, index: number): string => {
      if (typeof item === 'object' && item !== null && idField in item) {
        return String((item as Record<string, unknown>)[idField]);
      }
      return `item-${index}`;
    };
  },
};

// Memory management utilities
export const memoryUtils = {
  /**
   * Clear unused references
   */
  clearUnusedReferences: (obj: Record<string, any>): void => {
    Object.keys(obj).forEach(key => {
      if (obj[key] === null || obj[key] === undefined) {
        delete obj[key];
      }
    });
  },

  /**
   * Deep clone with memory optimization
   */
  deepClone: <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as T;
    }

    if (obj instanceof Array) {
      return obj.map(item => memoryUtils.deepClone(item)) as T;
    }

    if (typeof obj === 'object') {
      const cloned = {} as T;
      Object.keys(obj).forEach(key => {
        (cloned as any)[key] = memoryUtils.deepClone((obj as any)[key]);
      });
      return cloned;
    }

    return obj;
  },
};

// Image optimization utilities
export const imageOptimization = {
  /**
   * Get optimized image dimensions
   */
  getOptimizedDimensions: (
    originalWidth: number,
    originalHeight: number,
    maxWidth: number = 300,
    maxHeight: number = 300
  ): { width: number; height: number } => {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return { width: Math.round(width), height: Math.round(height) };
  },

  /**
   * Get image quality based on device performance
   */
  getImageQuality: (): number => {
    const isLowEnd = performanceUtils.isLowEndDevice();
    return isLowEnd ? 0.7 : 0.9;
  },
};

// Animation optimization utilities
export const animationUtils = {
  /**
   * Create optimized spring animation config
   */
  createSpringConfig: (isLowEnd: boolean = false) => ({
    tension: isLowEnd ? 100 : 120,
    friction: isLowEnd ? 8 : 7,
    useNativeDriver: true,
  }),

  /**
   * Create optimized timing animation config
   */
  createTimingConfig: (duration: number, isLowEnd: boolean = false) => ({
    duration: isLowEnd ? duration * 1.5 : duration,
    useNativeDriver: true,
  }),
};

// Bundle size optimization
export const bundleOptimization = {
  /**
   * Lazy load components
   */
  lazyLoad: <T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>
  ): React.LazyExoticComponent<T> => {
    return React.lazy(importFunc);
  },

  /**
   * Dynamic import with error handling
   */
  dynamicImport: async <T>(
    importFunc: () => Promise<T>,
    fallback?: T
  ): Promise<T | undefined> => {
    try {
      return await importFunc();
    } catch (error) {
      console.warn('Dynamic import failed:', error);
      return fallback;
    }
  },
};

// Performance monitoring
export const performanceMonitoring = {
  /**
   * Measure component render time
   */
  measureRenderTime: (componentName: string, renderFn: () => void): void => {
    if (__DEV__) {
      const start = performance.now();
      renderFn();
      const end = performance.now();
      console.log(`[Performance] ${componentName} render time: ${(end - start).toFixed(2)}ms`);
    } else {
      renderFn();
    }
  },

  /**
   * Track memory usage
   */
  trackMemoryUsage: (label: string): void => {
    if (__DEV__ && (performance as any).memory) {
      const memory = (performance as any).memory;
      console.log(`[Memory] ${label}:`, {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
      });
    }
  },
};