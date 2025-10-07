/**
 * Feature flags for safe, gradual refactoring
 * Allows toggling between old and new implementations
 */

export const FEATURE_FLAGS = {
  // Duplicate code refactoring flags
  USE_NEW_LOADING_UTILS: true,  // Enable for testing
  USE_NEW_STYLE_CONSTANTS: true,  // Enable for testing
  USE_NEW_ERROR_HANDLING: true,  // Enable for testing
  
  // Component consolidation flags
  USE_UNIFIED_PROGRESS_RING: true,  // Enable for testing
  USE_UNIFIED_LOADING_STATE: true,  // Enable for testing
  CONSOLIDATE_LOADING_COMPONENTS: true,  // Enable for testing
  
  // Cleanup flags
  REMOVE_DEBUG_LOGS: false,
  REMOVE_UNUSED_IMPORTS: false,
  CONSOLIDATE_DUPLICATE_STYLES: false,
  
  // Removed migration flags
  
  // Performance flags
  ENABLE_PERFORMANCE_MONITORING: false,
  ENABLE_MEMORY_OPTIMIZATION: false,
};

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (feature: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[feature];
};

// Helper function to enable a feature (for testing)
export const enableFeature = (feature: keyof typeof FEATURE_FLAGS): void => {
  if (__DEV__) {
    FEATURE_FLAGS[feature] = true;
    console.log(`Feature ${feature} enabled`);
  }
};

// Helper function to disable a feature (for rollback)
export const disableFeature = (feature: keyof typeof FEATURE_FLAGS): void => {
  if (__DEV__) {
    FEATURE_FLAGS[feature] = false;
    console.log(`Feature ${feature} disabled`);
  }
};
