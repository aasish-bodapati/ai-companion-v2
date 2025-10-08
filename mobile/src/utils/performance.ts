import { InteractionManager, Dimensions } from 'react-native';

// Performance optimization utilities for mobile
export const performanceUtils = {
  // Run expensive operations after interactions complete
  runAfterInteractions: (callback: () => void) => {
    InteractionManager.runAfterInteractions(callback);
  },

  // Debounce function calls to prevent excessive API calls
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

  // Throttle function calls to limit execution frequency
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

  // Memoize expensive calculations
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

  // Batch state updates to prevent multiple re-renders
  batchUpdates: (updates: (() => void)[]) => {
    InteractionManager.runAfterInteractions(() => {
      updates.forEach(update => update());
    });
  },

  // Check if device is low-end for performance optimization
  isLowEndDevice: (): boolean => {
    // Simple heuristic - can be enhanced with actual device detection
    const { width, height } = Dimensions.get('window');
    const totalPixels = width * height;
    return totalPixels < 1000000; // Less than 1MP
  },

  // Optimize image loading based on device performance
  getImageQuality: (): 'low' | 'medium' | 'high' => {
    if (performanceUtils.isLowEndDevice()) {
      return 'low';
    }
    return 'high';
  },

  // Memory management utilities
  memory: {
    // Clear unused data from memory
    clearCache: () => {
      // Clear any cached data
      if (global.gc) {
        global.gc();
      }
    },

    // Check memory usage (placeholder - would need native module)
    getMemoryUsage: () => {
      return {
        used: 0,
        total: 0,
        percentage: 0,
      };
    },
  },

  // Network optimization
  network: {
    // Check network quality
    getNetworkQuality: (): 'slow' | 'medium' | 'fast' => {
      // Placeholder - would need network info module
      return 'medium';
    },

    // Get appropriate timeout based on network quality
    getTimeout: (): number => {
      const quality = performanceUtils.network.getNetworkQuality();
      switch (quality) {
        case 'slow':
          return 30000; // 30 seconds
        case 'fast':
          return 5000;  // 5 seconds
        default:
          return 10000; // 10 seconds
      }
    },
  },

  // Animation performance
  animation: {
    // Use native driver when possible
    useNativeDriver: true,

    // Reduce animation complexity on low-end devices
    getAnimationConfig: () => {
      const isLowEnd = performanceUtils.isLowEndDevice();
      return {
        duration: isLowEnd ? 200 : 300,
        useNativeDriver: true,
        reduceMotion: isLowEnd,
      };
    },
  },

  // List performance optimization
  list: {
    // Get optimal batch size for lists
    getBatchSize: (): number => {
      if (performanceUtils.isLowEndDevice()) {
        return 10;
      }
      return 20;
    },

    // Get optimal window size for virtualized lists
    getWindowSize: (): number => {
      if (performanceUtils.isLowEndDevice()) {
        return 5;
      }
      return 10;
    },
  },
};

// API call optimization
export const apiOptimization = {
  // Cache API responses
  cache: new Map<string, { data: unknown; timestamp: number; ttl: number }>(),

  // Cache API response
  setCache: (key: string, data: unknown, ttl: number = 300000) => { // 5 minutes default
    apiOptimization.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  },

  // Get cached API response
  getCache: (key: string): unknown | null => {
    const cached = apiOptimization.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      apiOptimization.cache.delete(key);
      return null;
    }

    return cached.data;
  },

  // Clear expired cache entries
  clearExpiredCache: () => {
    const now = Date.now();
    for (const [key, value] of apiOptimization.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        apiOptimization.cache.delete(key);
      }
    }
  },

  // Clear all cache
  clearAllCache: () => {
    apiOptimization.cache.clear();
  },
};

// Image optimization
export const imageOptimization = {
  // Get optimized image URL based on device performance
  getOptimizedImageUrl: (baseUrl: string, width?: number, height?: number): string => {
    const quality = performanceUtils.getImageQuality();
    const isLowEnd = performanceUtils.isLowEndDevice();
    
    let optimizedUrl = baseUrl;
    
    if (width && height) {
      const scale = isLowEnd ? 0.5 : 1;
      const optimizedWidth = Math.round(width * scale);
      const optimizedHeight = Math.round(height * scale);
      optimizedUrl += `?w=${optimizedWidth}&h=${optimizedHeight}`;
    }
    
    if (quality === 'low') {
      optimizedUrl += `${optimizedUrl.includes('?') ? '&' : '?'}q=60`;
    } else if (quality === 'medium') {
      optimizedUrl += `${optimizedUrl.includes('?') ? '&' : '?'}q=80`;
    }
    
    return optimizedUrl;
  },

  // Lazy load images
  lazyLoad: (src: string, placeholder?: string): string => {
    return placeholder || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo=';
  },
};

// Component performance optimization
export const componentOptimization = {
  // Should component update based on props
  shouldUpdate: (prevProps: Record<string, unknown>, nextProps: Record<string, unknown>, keys: string[]): boolean => {
    return keys.some(key => prevProps[key] !== nextProps[key]);
  },

  // Memoize component props
  memoizeProps: <T extends Record<string, unknown>>(props: T, keys: string[]): Partial<T> => {
    const memoizedProps: Partial<T> = {};
    keys.forEach(key => {
      if (key in props) {
        (memoizedProps as Record<string, unknown>)[key] = props[key];
      }
    });
    return memoizedProps;
  },

  // Optimize list item rendering
  optimizeListItem: (item: unknown, index: number, data: unknown[]): boolean => {
    // Only render visible items
    const isVisible = index >= 0 && index < data.length;
    return isVisible;
  },
};
