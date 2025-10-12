// Utility functions and presets for LoadingState component

import { LoadingSize, LoadingVariant } from './LoadingState';

export const loadingStatePresets = {
  // Small loading states
  small: {
    size: 'small' as LoadingSize,
    variant: 'inline' as LoadingVariant,
    message: 'Loading...',
    showSpinner: true,
    showMessage: true,
  },

  // Medium loading states
  medium: {
    size: 'medium' as LoadingSize,
    variant: 'default' as LoadingVariant,
    message: 'Loading...',
    showSpinner: true,
    showMessage: true,
  },

  // Large loading states
  large: {
    size: 'large' as LoadingSize,
    variant: 'default' as LoadingVariant,
    message: 'Loading...',
    showSpinner: true,
    showMessage: true,
  },

  // Button loading states
  button: {
    size: 'small' as LoadingSize,
    variant: 'button' as LoadingVariant,
    message: 'Processing...',
    showSpinner: true,
    showMessage: true,
  },

  // Overlay loading states
  overlay: {
    size: 'large' as LoadingSize,
    variant: 'overlay' as LoadingVariant,
    message: 'Loading...',
    showSpinner: true,
    showMessage: true,
  },

  // Minimal loading states
  minimal: {
    size: 'small' as LoadingSize,
    variant: 'inline' as LoadingVariant,
    message: '',
    showSpinner: true,
    showMessage: false,
  },
};

// Common loading state configurations
export const loadingStateConfigs = {
  // Data fetching
  dataFetching: {
    ...loadingStatePresets.medium,
    message: 'Fetching data...',
  },

  // Form submission
  formSubmitting: {
    ...loadingStatePresets.button,
    message: 'Submitting...',
  },

  // File upload
  fileUploading: {
    ...loadingStatePresets.medium,
    message: 'Uploading file...',
  },

  // Authentication
  authenticating: {
    ...loadingStatePresets.overlay,
    message: 'Signing in...',
  },

  // Exercise loading
  exerciseLoading: {
    ...loadingStatePresets.medium,
    message: 'Loading exercises...',
  },

  // Workout saving
  workoutSaving: {
    ...loadingStatePresets.button,
    message: 'Saving workout...',
  },

  // Routine creating
  routineCreating: {
    ...loadingStatePresets.button,
    message: 'Creating routine...',
  },

  // Profile updating
  profileUpdating: {
    ...loadingStatePresets.button,
    message: 'Updating profile...',
  },

  // Data syncing
  dataSyncing: {
    ...loadingStatePresets.minimal,
    message: 'Syncing...',
  },

  // Search loading
  searchLoading: {
    ...loadingStatePresets.small,
    message: 'Searching...',
  },
};

// Helper function to get loading state configuration
export const getLoadingStateConfig = (type: keyof typeof loadingStateConfigs) => {
  return loadingStateConfigs[type];
};

// Helper function to create custom loading state configuration
export const createLoadingStateConfig = (
  baseType: keyof typeof loadingStatePresets,
  overrides: Partial<typeof loadingStatePresets[keyof typeof loadingStatePresets]> = {}
) => {
  return {
    ...loadingStatePresets[baseType],
    ...overrides,
  };
};

// Loading state utilities
export const loadingStateUtils = {
  // Get loading message based on context
  getContextualMessage: (context: string, action?: string) => {
    const messages: Record<string, string> = {
      'data': 'Loading data...',
      'exercises': 'Loading exercises...',
      'workouts': 'Loading workouts...',
      'routines': 'Loading routines...',
      'nutrition': 'Loading nutrition data...',
      'profile': 'Loading profile...',
      'settings': 'Loading settings...',
      'search': 'Searching...',
      'save': 'Saving...',
      'update': 'Updating...',
      'delete': 'Deleting...',
      'upload': 'Uploading...',
      'download': 'Downloading...',
      'sync': 'Syncing...',
      'auth': 'Authenticating...',
    };

    if (action && messages[action]) {
      return messages[action];
    }

    if (messages[context]) {
      return messages[context];
    }

    return 'Loading...';
  },

  // Get appropriate size based on container
  getSizeForContainer: (containerType: 'screen' | 'modal' | 'card' | 'button' | 'list') => {
    const sizeMap: Record<string, LoadingSize> = {
      'screen': 'large',
      'modal': 'medium',
      'card': 'small',
      'button': 'small',
      'list': 'small',
    };

    return sizeMap[containerType] || 'medium';
  },

  // Get appropriate variant based on context
  getVariantForContext: (context: 'page' | 'modal' | 'card' | 'button' | 'inline') => {
    const variantMap: Record<string, LoadingVariant> = {
      'page': 'overlay',
      'modal': 'default',
      'card': 'default',
      'button': 'button',
      'inline': 'inline',
    };

    return variantMap[context] || 'default';
  },
};

// Loading state animations
export const loadingStateAnimations = {
  // Fade in animation
  fadeIn: {
    opacity: 1,
    duration: 300,
  },

  // Fade out animation
  fadeOut: {
    opacity: 0,
    duration: 200,
  },

  // Scale animation
  scale: {
    scale: 1,
    duration: 200,
  },

  // Slide animation
  slide: {
    translateY: 0,
    duration: 300,
  },
};

// Loading state colors
export const loadingStateColors = {
  primary: '#6366f1',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  muted: '#9ca3af',
};
