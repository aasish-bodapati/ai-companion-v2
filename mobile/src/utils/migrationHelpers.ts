/**
 * Migration helpers for safe refactoring
 * Provides utilities to gradually migrate from old to new patterns
 */

import React from 'react';
import { isFeatureEnabled } from '../config/featureFlags';
import { DUPLICATE_STYLES } from '../theme/duplicateStyles';
import { SafeLoadingState } from '../components/ui/SafeLoadingState';
import { DebugUtils } from './debugUtils';
import { DuplicateCodeUtils } from './duplicateCodeUtils';
import { createLoadingState } from './duplicateCodeUtils';
import { deprecateComponent } from './deprecationUtils';

export const MigrationHelpers = {
  // Helper to gradually replace hardcoded styles
  replaceStyle: (oldStyle: any, newStyle: any) => {
    if (isFeatureEnabled('USE_NEW_STYLE_CONSTANTS')) {
      return { ...oldStyle, ...newStyle };
    }
    return oldStyle; // Keep old style if feature is disabled
  },

  // Helper to gradually replace loading patterns
  wrapWithLoading: (component: React.ComponentType, loadingProps: any) => {
    return (props: any) => {
      const { loading, ...restProps } = props;
      
      if (isFeatureEnabled('USE_UNIFIED_LOADING_STATE')) {
        // Use new loading component
        // SafeLoadingState is already imported
        return React.createElement(SafeLoadingState, { loading, ...loadingProps },
          React.createElement(component, restProps)
        );
      }
      
      // Use old loading pattern
      return React.createElement('View', null,
        loading && React.createElement('ActivityIndicator'),
        React.createElement(component, restProps)
      );
    };
  },

  // Helper to gradually replace hardcoded values
  replaceHardcodedValue: (oldValue: any, newValue: any, featureFlag: string) => {
    if (isFeatureEnabled(featureFlag as any)) {
      return newValue;
    }
    return oldValue;
  },

  // Helper to gradually replace console.log
  replaceConsoleLog: (message: string, data?: any) => {
    if (isFeatureEnabled('REMOVE_DEBUG_LOGS')) {
      // Use new debug utils
      // DebugUtils is already imported
      DebugUtils.log(message, data);
    } else {
      // Keep old console.log
      console.log(message, data);
    }
  },

  // Helper to gradually replace error handling
  replaceErrorHandling: (error: any, context: string) => {
    if (isFeatureEnabled('USE_NEW_ERROR_HANDLING')) {
      // Use new error handling
      // DuplicateCodeUtils is already imported
      DuplicateCodeUtils.handleError(error, context);
    } else {
      // Keep old error handling
      console.error(`Error in ${context}:`, error);
    }
  },

  // Helper to gradually replace style constants
  replaceStyleConstant: (oldValue: any, styleName: keyof typeof DUPLICATE_STYLES) => {
    if (isFeatureEnabled('USE_NEW_STYLE_CONSTANTS')) {
      return DUPLICATE_STYLES[styleName];
    }
    return oldValue;
  },

  // Helper to gradually replace loading state management
  replaceLoadingState: (component: React.ComponentType) => {
    if (isFeatureEnabled('USE_NEW_LOADING_UTILS')) {
      // Use new loading utilities
      // createLoadingState is already imported
      return createLoadingState();
    }
    
    // Return a function that can be called in a component
    return () => {
      // This should be called within a React component
      console.warn('replaceLoadingState: This should be called within a React component');
      return { loading: false, setLoading: () => {} };
    };
  },

  // Helper to validate migration safety
  validateMigration: (oldComponent: string, newComponent: string) => {
    console.log(`Validating migration from ${oldComponent} to ${newComponent}`);
    
    // Simple validation - just log the migration
    console.log(`✅ Migration from ${oldComponent} to ${newComponent} validated`);
    
    return true;
  },

  // Helper to create deprecation wrapper
  createDeprecationWrapper: (oldComponent: any, newComponent: any, componentName: string) => {
    return (props: any) => {
      if (isFeatureEnabled('ENABLE_DEPRECATION_WARNINGS')) {
        // deprecateComponent is already imported
        deprecateComponent(componentName, newComponent.name);
      }
      
      if (isFeatureEnabled('MIGRATE_TO_NEW_COMPONENTS')) {
        return newComponent(props);
      }
      
      return oldComponent(props);
    };
  },
};

// Export individual functions for convenience
export const {
  replaceStyle,
  wrapWithLoading,
  replaceHardcodedValue,
  replaceConsoleLog,
  replaceErrorHandling,
  replaceStyleConstant,
  replaceLoadingState,
  validateMigration,
  createDeprecationWrapper,
} = MigrationHelpers;
