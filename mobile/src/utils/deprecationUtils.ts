/**
 * Deprecation utilities for safe component migration
 * Provides warnings when using deprecated components/functions
 */

export const DeprecationUtils = {
  deprecateComponent: (componentName: string, replacement: string, version?: string) => {
    if (__DEV__) {
      const versionText = version ? ` (since v${version})` : '';
      console.warn(
        `⚠️ ${componentName} is deprecated${versionText}. Use ${replacement} instead.`
      );
    }
  },
  
  deprecateFunction: (functionName: string, replacement: string, version?: string) => {
    if (__DEV__) {
      const versionText = version ? ` (since v${version})` : '';
      console.warn(
        `⚠️ ${functionName} is deprecated${versionText}. Use ${replacement} instead.`
      );
    }
  },
  
  deprecateProp: (propName: string, replacement: string, componentName: string) => {
    if (__DEV__) {
      console.warn(
        `⚠️ ${propName} prop in ${componentName} is deprecated. Use ${replacement} instead.`
      );
    }
  },
  
  deprecateStyle: (styleName: string, replacement: string) => {
    if (__DEV__) {
      console.warn(
        `⚠️ ${styleName} style is deprecated. Use ${replacement} instead.`
      );
    }
  },
  
  // Track usage of deprecated items
  trackUsage: (itemName: string) => {
    if (__DEV__) {
      // In development, we could track usage for analytics
      // This helps identify which deprecated items are still being used
      console.info(`[DEPRECATION TRACKING] ${itemName} is still in use`);
    }
  },
};

// Export individual functions for convenience
export const { 
  deprecateComponent, 
  deprecateFunction, 
  deprecateProp, 
  deprecateStyle,
  trackUsage 
} = DeprecationUtils;
