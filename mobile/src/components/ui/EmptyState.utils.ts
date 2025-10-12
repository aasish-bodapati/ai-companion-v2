// Utility functions and presets for EmptyState component

import { EmptyStateSize, EmptyStateVariant } from './EmptyState';


export const emptyStatePresets = {
  // Small empty states
  small: {
    size: 'small' as EmptyStateSize,
    variant: 'minimal' as EmptyStateVariant,
    showIcon: true,
    icon: 'document-outline' as const,
  },

  // Medium empty states
  medium: {
    size: 'medium' as EmptyStateSize,
    variant: 'default' as EmptyStateVariant,
    showIcon: true,
    icon: 'document-outline' as const,
  },

  // Large empty states
  large: {
    size: 'large' as EmptyStateSize,
    variant: 'detailed' as EmptyStateVariant,
    showIcon: true,
    icon: 'document-outline' as const,
  },

  // Actionable empty states
  actionable: {
    size: 'medium' as EmptyStateSize,
    variant: 'actionable' as EmptyStateVariant,
    showIcon: true,
    icon: 'add-circle-outline' as const,
  },

  // Minimal empty states
  minimal: {
    size: 'small' as EmptyStateSize,
    variant: 'minimal' as EmptyStateVariant,
    showIcon: false,
  },
};

// Common empty state configurations
export const emptyStateConfigs = {
  // No data found
  noData: {
    ...emptyStatePresets.medium,
    icon: 'document-outline' as const,
    title: 'No data found',
    subtitle: 'There are no items to display at the moment.',
  },

  // No exercises
  noExercises: {
    ...emptyStatePresets.actionable,
    icon: 'fitness-outline' as const,
    title: 'No exercises found',
    subtitle: 'Start by adding some exercises to your workout.',
    actionText: 'Add Exercise',
    actionIcon: 'add-circle-outline' as const,
  },

  // No workouts
  noWorkouts: {
    ...emptyStatePresets.actionable,
    icon: 'barbell-outline' as const,
    title: 'No workouts logged',
    subtitle: 'Start tracking your fitness journey by logging your first workout.',
    actionText: 'Log Workout',
    actionIcon: 'add-circle-outline' as const,
  },

  // No routines
  noRoutines: {
    ...emptyStatePresets.actionable,
    icon: 'list-outline' as const,
    title: 'No routines created',
    subtitle: 'Create your first workout routine to get started.',
    actionText: 'Create Routine',
    actionIcon: 'add-circle-outline' as const,
  },

  // No nutrition logs
  noNutritionLogs: {
    ...emptyStatePresets.actionable,
    icon: 'nutrition-outline' as const,
    title: 'No nutrition logs',
    subtitle: 'Start tracking your nutrition by logging your first meal.',
    actionText: 'Log Meal',
    actionIcon: 'add-circle-outline' as const,
  },

  // No water logs
  noWaterLogs: {
    ...emptyStatePresets.actionable,
    icon: 'water-outline' as const,
    title: 'No water logged',
    subtitle: 'Start tracking your hydration by logging your water intake.',
    actionText: 'Log Water',
    actionIcon: 'add-circle-outline' as const,
  },

  // Search no results
  searchNoResults: {
    ...emptyStatePresets.medium,
    icon: 'search-outline' as const,
    title: 'No results found',
    subtitle: 'Try adjusting your search terms or filters.',
  },

  // Network error
  networkError: {
    ...emptyStatePresets.medium,
    icon: 'wifi-outline' as const,
    title: 'Connection error',
    subtitle: 'Please check your internet connection and try again.',
    actionText: 'Retry',
    actionIcon: 'refresh-outline' as const,
  },

  // Permission denied
  permissionDenied: {
    ...emptyStatePresets.medium,
    icon: 'lock-closed-outline' as const,
    title: 'Permission required',
    subtitle: 'Please grant the necessary permissions to continue.',
    actionText: 'Grant Permission',
    actionIcon: 'settings-outline' as const,
  },

  // Feature coming soon
  comingSoon: {
    ...emptyStatePresets.medium,
    icon: 'time-outline' as const,
    title: 'Coming soon',
    subtitle: 'This feature is currently under development.',
  },

  // Maintenance mode
  maintenance: {
    ...emptyStatePresets.large,
    icon: 'construct-outline' as const,
    title: 'Under maintenance',
    subtitle: 'We are currently performing maintenance. Please try again later.',
  },
};

// Helper function to get empty state configuration
export const getEmptyStateConfig = (type: keyof typeof emptyStateConfigs) => {
  return emptyStateConfigs[type];
};

// Helper function to create custom empty state configuration
export const createEmptyStateConfig = (
  baseType: keyof typeof emptyStatePresets,
  overrides: Partial<typeof emptyStatePresets[keyof typeof emptyStatePresets]> = {}
) => {
  return {
    ...emptyStatePresets[baseType],
    ...overrides,
  };
};

// Empty state utilities
export const emptyStateUtils = {
  // Get contextual empty state based on data type
  getContextualEmptyState: (dataType: string, hasAction = false) => {
    const contextualStates: Record<string, any> = {
      'exercises': {
        ...emptyStateConfigs.noExercises,
        actionText: hasAction ? 'Add Exercise' : undefined,
        actionIcon: hasAction ? 'add-circle-outline' : undefined,
      },
      'workouts': {
        ...emptyStateConfigs.noWorkouts,
        actionText: hasAction ? 'Log Workout' : undefined,
        actionIcon: hasAction ? 'add-circle-outline' : undefined,
      },
      'routines': {
        ...emptyStateConfigs.noRoutines,
        actionText: hasAction ? 'Create Routine' : undefined,
        actionIcon: hasAction ? 'add-circle-outline' : undefined,
      },
      'nutrition': {
        ...emptyStateConfigs.noNutritionLogs,
        actionText: hasAction ? 'Log Meal' : undefined,
        actionIcon: hasAction ? 'add-circle-outline' : undefined,
      },
      'water': {
        ...emptyStateConfigs.noWaterLogs,
        actionText: hasAction ? 'Log Water' : undefined,
        actionIcon: hasAction ? 'add-circle-outline' : undefined,
      },
    };

    return contextualStates[dataType] || emptyStateConfigs.noData;
  },

  // Get appropriate size based on container
  getSizeForContainer: (containerType: 'screen' | 'modal' | 'card' | 'list') => {
    const sizeMap: Record<string, EmptyStateSize> = {
      'screen': 'large',
      'modal': 'medium',
      'card': 'small',
      'list': 'small',
    };

    return sizeMap[containerType] || 'medium';
  },

  // Get appropriate variant based on context
  getVariantForContext: (context: 'page' | 'modal' | 'card' | 'list') => {
    const variantMap: Record<string, EmptyStateVariant> = {
      'page': 'detailed',
      'modal': 'default',
      'card': 'minimal',
      'list': 'minimal',
    };

    return variantMap[context] || 'default';
  },

  // Get appropriate icon based on data type
  getIconForDataType: (dataType: string) => {
    const iconMap: Record<string, string> = {
      'exercises': 'fitness-outline',
      'workouts': 'barbell-outline',
      'routines': 'list-outline',
      'nutrition': 'nutrition-outline',
      'water': 'water-outline',
      'mood': 'happy-outline',
      'sleep': 'moon-outline',
      'steps': 'walk-outline',
      'calories': 'flame-outline',
      'weight': 'scale-outline',
      'measurements': 'resize-outline',
      'goals': 'flag-outline',
      'achievements': 'trophy-outline',
      'notifications': 'notifications-outline',
      'settings': 'settings-outline',
      'profile': 'person-outline',
      'search': 'search-outline',
      'error': 'alert-circle-outline',
      'warning': 'warning-outline',
      'info': 'information-circle-outline',
      'success': 'checkmark-circle-outline',
    };

    return iconMap[dataType] || 'document-outline';
  },
};

// Empty state animations
export const emptyStateAnimations = {
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

  // Bounce animation
  bounce: {
    scale: 1.05,
    duration: 200,
  },
};

// Empty state colors
export const emptyStateColors = {
  primary: '#6366f1',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  muted: '#9ca3af',
  disabled: '#d1d5db',
};
