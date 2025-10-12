import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { shallow } from 'zustand/shallow';

/**
 * Performance optimization utilities for React components
 */

// Memoized component wrapper with proper prop comparison
export function withMemo<T extends React.ComponentType<any>>(
  Component: T,
  areEqual?: (prevProps: React.ComponentProps<T>, nextProps: React.ComponentProps<T>) => boolean
): React.MemoExoticComponent<T> {
  return React.memo(Component, areEqual);
}

// Hook for memoizing expensive calculations
export function useExpensiveCalculation<T>(
  calculation: () => T,
  dependencies: React.DependencyList
): T {
  return useMemo(calculation, dependencies);
}

// Hook for memoizing callbacks with proper dependencies
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: React.DependencyList
): T {
  return useCallback(callback, dependencies);
}

// Hook for debouncing values
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for throttling values
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    if (Date.now() >= lastExecuted.current + delay) {
      lastExecuted.current = Date.now();
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [value, delay]);

  return throttledValue;
}

// Hook for memoizing Zustand selectors
export function useZustandSelector<T, R>(
  store: (selector: (state: T) => R) => R,
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
): R {
  return store(useCallback(selector, []), equalityFn || shallow);
}

// Hook for memoizing multiple Zustand selectors
export function useZustandSelectors<T, R extends Record<string, any>>(
  store: (selector: (state: T) => any) => any,
  selectors: { [K in keyof R]: (state: T) => R[K] }
): R {
  return store(
    useCallback((state: T) => {
      const result = {} as R;
      for (const key in selectors) {
        result[key] = selectors[key](state);
      }
      return result;
    }, []),
    shallow
  );
}

// Hook for preventing unnecessary re-renders
export function useStableValue<T>(value: T): T {
  const ref = useRef<T>(value);
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
}

// Hook for memoizing object creation
export function useStableObject<T extends Record<string, any>>(obj: T): T {
  return useMemo(() => obj, Object.values(obj));
}

// Hook for memoizing array creation
export function useStableArray<T>(arr: T[]): T[] {
  return useMemo(() => arr, arr);
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  
  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;
    
    if (__DEV__) {
      console.log(`🔄 [PERFORMANCE] ${componentName} rendered ${renderCount.current} times, ${timeSinceLastRender}ms since last render`);
    }
  });
  
  return {
    renderCount: renderCount.current,
    resetRenderCount: () => { renderCount.current = 0; },
  };
}

// Higher-order component for performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = React.memo((props: P) => {
    const name = componentName || Component.displayName || Component.name || 'Unknown';
    usePerformanceMonitor(name);
    return <Component {...props} />;
  });
  
  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName || Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default {
  withMemo,
  useExpensiveCalculation,
  useStableCallback,
  useDebounce,
  useThrottle,
  useZustandSelector,
  useZustandSelectors,
  useStableValue,
  useStableObject,
  useStableArray,
  usePerformanceMonitor,
  withPerformanceMonitoring,
};
