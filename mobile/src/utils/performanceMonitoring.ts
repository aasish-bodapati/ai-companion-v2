/**
 * Performance monitoring utilities
 */

import { Dimensions, Platform } from 'react-native';
import { DebugUtils } from './debugUtils';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  sessionId: string;
  startTime: number;
  endTime: number;
  metrics: PerformanceMetric[];
  deviceInfo: DeviceInfo;
  appInfo: AppInfo;
}

export interface DeviceInfo {
  platform: string;
  version: string;
  model?: string;
  memory?: number;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
}

export interface AppInfo {
  version: string;
  buildNumber: string;
  bundleId: string;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private sessionId: string;
  private sessionStartTime: number;
  private isEnabled: boolean = __DEV__;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.setupPerformanceObservers();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupPerformanceObservers() {
    if (!this.isEnabled) return;

    // Monitor memory usage
    this.startMemoryMonitoring();

    // Monitor frame drops
    this.startFrameMonitoring();

    // Monitor network performance
    this.startNetworkMonitoring();
  }

  /**
   * Start timing a performance metric
   */
  startTiming(name: string): void {
    if (!this.isEnabled) return;
    this.timers.set(name, Date.now());
  }

  /**
   * End timing a performance metric
   */
  endTiming(name: string, metadata?: Record<string, any>): number {
    if (!this.isEnabled) return 0;

    const startTime = this.timers.get(name);
    if (!startTime) {
      DebugUtils.warn(`PerformanceMonitor: Timer '${name}' not found`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(name);

    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata,
    });

    return duration;
  }

  /**
   * Record a custom metric
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    this.metrics.push(metric);

    // Log in development
    if (__DEV__) {
      DebugUtils.log(`PerformanceMetric [${metric.name}]:`, {
        value: metric.value,
        unit: metric.unit,
        metadata: metric.metadata,
      });
    }

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Measure function execution time
   */
  measureFunction<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    this.startTiming(name);
    try {
      const result = fn();
      this.endTiming(name, metadata);
      return result;
    } catch (error) {
      this.endTiming(name, { ...metadata, error: error.message });
      throw error;
    }
  }

  /**
   * Measure async function execution time
   */
  async measureAsyncFunction<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startTiming(name);
    try {
      const result = await fn();
      this.endTiming(name, metadata);
      return result;
    } catch (error) {
      this.endTiming(name, { ...metadata, error: error.message });
      throw error;
    }
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (Platform.OS !== 'web' || !(performance as any).memory) return;

    const monitorMemory = () => {
      const memory = (performance as any).memory;
      this.recordMetric({
        name: 'memory_used',
        value: memory.usedJSHeapSize,
        unit: 'bytes',
        timestamp: Date.now(),
        metadata: {
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        },
      });
    };

    // Monitor memory every 30 seconds
    setInterval(monitorMemory, 30000);
  }

  /**
   * Start frame monitoring
   */
  private startFrameMonitoring(): void {
    let frameCount = 0;
    let lastTime = Date.now();
    let droppedFrames = 0;

    const monitorFrames = () => {
      const now = Date.now();
      const delta = now - lastTime;
      
      // Expected frame time is ~16.67ms for 60fps
      const expectedFrames = Math.floor(delta / 16.67);
      const actualFrames = frameCount;
      
      if (actualFrames < expectedFrames) {
        droppedFrames += expectedFrames - actualFrames;
      }

      frameCount = 0;
      lastTime = now;

      // Record frame metrics every second
      this.recordMetric({
        name: 'fps',
        value: actualFrames,
        unit: 'fps',
        timestamp: Date.now(),
        metadata: {
          droppedFrames,
          expectedFrames,
        },
      });

      droppedFrames = 0;
    };

    // Monitor frames every second
    setInterval(monitorFrames, 1000);

    // Count frames
    const countFrame = () => {
      frameCount++;
      requestAnimationFrame(countFrame);
    };
    requestAnimationFrame(countFrame);
  }

  /**
   * Start network monitoring
   */
  private startNetworkMonitoring(): void {
    // This would integrate with your network layer
    // For now, we'll just log that it's available
    DebugUtils.log('Network monitoring initialized');
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): PerformanceReport {
    const deviceInfo: DeviceInfo = {
      platform: Platform.OS,
      version: Platform.Version.toString(),
      screenWidth: Dimensions.get('window').width,
      screenHeight: Dimensions.get('window').height,
      pixelRatio: Dimensions.get('window').scale,
    };

    const appInfo: AppInfo = {
      version: '1.0.0', // Would come from app config
      buildNumber: '1', // Would come from app config
      bundleId: 'com.healthlog.app', // Would come from app config
    };

    return {
      sessionId: this.sessionId,
      startTime: this.sessionStartTime,
      endTime: Date.now(),
      metrics: [...this.metrics],
      deviceInfo,
      appInfo,
    };
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  /**
   * Get average metric value
   */
  getAverageMetric(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }

  /**
   * Get latest metric value
   */
  getLatestMetric(name: string): PerformanceMetric | null {
    const metrics = this.getMetricsByName(name);
    return metrics.length > 0 ? metrics[metrics.length - 1] : null;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if monitoring is enabled
   */
  isMonitoringEnabled(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Export convenience functions
export const startTiming = (name: string) => performanceMonitor.startTiming(name);
export const endTiming = (name: string, metadata?: Record<string, any>) => 
  performanceMonitor.endTiming(name, metadata);
export const recordMetric = (metric: PerformanceMetric) => 
  performanceMonitor.recordMetric(metric);
export const measureFunction = <T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, any>
) => performanceMonitor.measureFunction(name, fn, metadata);
export const measureAsyncFunction = <T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
) => performanceMonitor.measureAsyncFunction(name, fn, metadata);

// Export types
export { PerformanceMetric, PerformanceReport, DeviceInfo, AppInfo };
