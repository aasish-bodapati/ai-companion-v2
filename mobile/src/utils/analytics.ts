/**
 * Analytics utilities
 */

import { Platform } from 'react-native';
import { DebugUtils } from './debugUtils';
import { performanceMonitor } from './performanceMonitoring';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
  context?: {
    screen?: string;
    action?: string;
    metadata?: Record<string, any>;
  };
}

export interface UserProperties {
  userId: string;
  properties: Record<string, any>;
}

export interface AnalyticsConfig {
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  batchSize: number;
  flushInterval: number;
  enablePerformanceTracking: boolean;
  enableUserTracking: boolean;
  enableScreenTracking: boolean;
  enableCrashTracking: boolean;
}

class Analytics {
  private static instance: Analytics;
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private userProperties: UserProperties | null = null;
  private currentScreen: string | null = null;
  private isFlushing = false;
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.config = {
      enabled: true,
      batchSize: 20,
      flushInterval: 30000, // 30 seconds
      enablePerformanceTracking: true,
      enableUserTracking: true,
      enableScreenTracking: true,
      enableCrashTracking: true,
    };

    this.startFlushTimer();
  }

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  /**
   * Configure analytics
   */
  configure(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
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
   * Track an event
   */
  track(
    eventName: string,
    properties?: Record<string, any>,
    context?: { screen?: string; action?: string; metadata?: Record<string, any> }
  ): void {
    if (!this.config.enabled) {
      DebugUtils.log('Analytics: Event tracked but analytics is disabled', {
        eventName,
        properties,
        context,
      });
      return;
    }

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        platform: Platform.OS,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      userId: this.userProperties?.userId,
      sessionId: performanceMonitor.getPerformanceReport().sessionId,
      context: {
        screen: context?.screen || this.currentScreen,
        action: context?.action,
        metadata: context?.metadata,
      },
    };

    this.eventQueue.push(event);

    // Log in development
    if (__DEV__) {
      DebugUtils.log('Analytics: Event tracked', event);
    }

    // Flush if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Track screen view
   */
  trackScreen(screenName: string, properties?: Record<string, any>): void {
    if (!this.config.enableScreenTracking) return;

    this.currentScreen = screenName;
    this.track('screen_view', {
      screen_name: screenName,
      ...properties,
    }, { screen: screenName });
  }

  /**
   * Track user action
   */
  trackAction(
    action: string,
    properties?: Record<string, any>,
    screen?: string
  ): void {
    this.track('user_action', {
      action,
      ...properties,
    }, { screen: screen || this.currentScreen, action });
  }

  /**
   * Track performance metric
   */
  trackPerformance(
    metricName: string,
    value: number,
    unit: string,
    properties?: Record<string, any>
  ): void {
    if (!this.config.enablePerformanceTracking) return;

    this.track('performance_metric', {
      metric_name: metricName,
      value,
      unit,
      ...properties,
    });
  }

  /**
   * Track error
   */
  trackError(
    error: Error,
    context?: string,
    properties?: Record<string, any>
  ): void {
    if (!this.config.enableCrashTracking) return;

    this.track('error', {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
      context,
      ...properties,
    }, { action: 'error', metadata: { context } });
  }

  /**
   * Track user properties
   */
  identify(userId: string, properties?: Record<string, any>): void {
    if (!this.config.enableUserTracking) return;

    this.userProperties = {
      userId,
      properties: properties || {},
    };

    this.track('user_identified', {
      user_id: userId,
      ...properties,
    });
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, any>): void {
    if (!this.config.enableUserTracking || !this.userProperties) return;

    this.userProperties.properties = {
      ...this.userProperties.properties,
      ...properties,
    };

    this.track('user_properties_updated', properties);
  }

  /**
   * Track conversion
   */
  trackConversion(
    conversionName: string,
    value?: number,
    properties?: Record<string, any>
  ): void {
    this.track('conversion', {
      conversion_name: conversionName,
      value,
      ...properties,
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(
    featureName: string,
    properties?: Record<string, any>
  ): void {
    this.track('feature_usage', {
      feature_name: featureName,
      ...properties,
    });
  }

  /**
   * Track A/B test
   */
  trackABTest(
    testName: string,
    variant: string,
    properties?: Record<string, any>
  ): void {
    this.track('ab_test', {
      test_name: testName,
      variant,
      ...properties,
    });
  }

  /**
   * Track custom event
   */
  trackCustom(
    eventName: string,
    properties?: Record<string, any>,
    context?: { screen?: string; action?: string; metadata?: Record<string, any> }
  ): void {
    this.track(eventName, properties, context);
  }

  /**
   * Flush events
   */
  async flush(): Promise<void> {
    if (this.isFlushing || this.eventQueue.length === 0) {
      return;
    }

    this.isFlushing = true;

    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];

      if (this.config.endpoint) {
        await this.sendToEndpoint(events);
      } else {
        // In development, just log the events
        DebugUtils.log('Analytics: Would send events', events);
      }
    } catch (error) {
      DebugUtils.error('Analytics: Failed to send events', error);
      // Put events back in queue for retry
      this.eventQueue.unshift(...this.eventQueue);
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Send events to endpoint
   */
  private async sendToEndpoint(events: AnalyticsEvent[]): Promise<void> {
    // This would integrate with your analytics service
    // For now, just simulate the request
    DebugUtils.log('Analytics: Sending events to endpoint', {
      endpoint: this.config.endpoint,
      count: events.length,
    });

    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Get analytics statistics
   */
  getAnalyticsStats() {
    return {
      totalEvents: this.eventQueue.length,
      eventTypes: this.eventQueue.reduce((acc, event) => {
        acc[event.name] = (acc[event.name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      currentScreen: this.currentScreen,
      userIdentified: !!this.userProperties,
    };
  }

  /**
   * Clear event queue
   */
  clearEventQueue(): void {
    this.eventQueue = [];
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }
}

// Export singleton instance
export const analytics = Analytics.getInstance();

// Export convenience functions
export const track = (
  eventName: string,
  properties?: Record<string, any>,
  context?: { screen?: string; action?: string; metadata?: Record<string, any> }
) => analytics.track(eventName, properties, context);

export const trackScreen = (screenName: string, properties?: Record<string, any>) =>
  analytics.trackScreen(screenName, properties);

export const trackAction = (
  action: string,
  properties?: Record<string, any>,
  screen?: string
) => analytics.trackAction(action, properties, screen);

export const trackPerformance = (
  metricName: string,
  value: number,
  unit: string,
  properties?: Record<string, any>
) => analytics.trackPerformance(metricName, value, unit, properties);

export const trackError = (
  error: Error,
  context?: string,
  properties?: Record<string, any>
) => analytics.trackError(error, context, properties);

export const identify = (userId: string, properties?: Record<string, any>) =>
  analytics.identify(userId, properties);

export const setUserProperties = (properties: Record<string, any>) =>
  analytics.setUserProperties(properties);

export const trackConversion = (
  conversionName: string,
  value?: number,
  properties?: Record<string, any>
) => analytics.trackConversion(conversionName, value, properties);

export const trackFeatureUsage = (
  featureName: string,
  properties?: Record<string, any>
) => analytics.trackFeatureUsage(featureName, properties);

export const trackABTest = (
  testName: string,
  variant: string,
  properties?: Record<string, any>
) => analytics.trackABTest(testName, variant, properties);

export const trackCustom = (
  eventName: string,
  properties?: Record<string, any>,
  context?: { screen?: string; action?: string; metadata?: Record<string, any> }
) => analytics.trackCustom(eventName, properties, context);

// Export types
export { AnalyticsEvent, UserProperties, AnalyticsConfig };
