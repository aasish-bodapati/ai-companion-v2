// Utility functions and presets for ConfirmationDialog component

import { ConfirmationVariant, ConfirmationSize } from './ConfirmationDialog';

export const confirmationDialogPresets = {
  // Small confirmation dialogs
  small: {
    size: 'small' as ConfirmationSize,
    variant: 'default' as ConfirmationVariant,
    showCancel: true,
    showCloseButton: true,
    closeOnBackdrop: true,
  },

  // Medium confirmation dialogs
  medium: {
    size: 'medium' as ConfirmationSize,
    variant: 'default' as ConfirmationVariant,
    showCancel: true,
    showCloseButton: true,
    closeOnBackdrop: true,
  },

  // Large confirmation dialogs
  large: {
    size: 'large' as ConfirmationSize,
    variant: 'default' as ConfirmationVariant,
    showCancel: true,
    showCloseButton: true,
    closeOnBackdrop: true,
  },

  // Danger confirmation dialogs
  danger: {
    size: 'medium' as ConfirmationSize,
    variant: 'danger' as ConfirmationVariant,
    showCancel: true,
    showCloseButton: true,
    closeOnBackdrop: false,
  },

  // Warning confirmation dialogs
  warning: {
    size: 'medium' as ConfirmationSize,
    variant: 'warning' as ConfirmationVariant,
    showCancel: true,
    showCloseButton: true,
    closeOnBackdrop: true,
  },

  // Info confirmation dialogs
  info: {
    size: 'medium' as ConfirmationSize,
    variant: 'info' as ConfirmationVariant,
    showCancel: true,
    showCloseButton: true,
    closeOnBackdrop: true,
  },

  // Success confirmation dialogs
  success: {
    size: 'medium' as ConfirmationSize,
    variant: 'success' as ConfirmationVariant,
    showCancel: false,
    showCloseButton: true,
    closeOnBackdrop: true,
  },
};

// Common confirmation dialog configurations
export const confirmationDialogConfigs = {
  // Delete confirmation
  deleteConfirmation: {
    ...confirmationDialogPresets.danger,
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item? This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    confirmIcon: 'trash-outline',
    cancelIcon: 'close-outline',
  },

  // Logout confirmation
  logoutConfirmation: {
    ...confirmationDialogPresets.warning,
    title: 'Sign Out',
    message: 'Are you sure you want to sign out?',
    confirmText: 'Sign Out',
    cancelText: 'Cancel',
    confirmIcon: 'log-out-outline',
    cancelIcon: 'close-outline',
  },

  // Discard changes confirmation
  discardChangesConfirmation: {
    ...confirmationDialogPresets.warning,
    title: 'Discard Changes',
    message: 'You have unsaved changes. Are you sure you want to discard them?',
    confirmText: 'Discard',
    cancelText: 'Keep Editing',
    confirmIcon: 'close-outline',
    cancelIcon: 'pencil-outline',
  },

  // Clear data confirmation
  clearDataConfirmation: {
    ...confirmationDialogPresets.danger,
    title: 'Clear All Data',
    message: 'This will permanently delete all your data. This action cannot be undone.',
    confirmText: 'Clear All',
    cancelText: 'Cancel',
    confirmIcon: 'trash-outline',
    cancelIcon: 'close-outline',
  },

  // Reset settings confirmation
  resetSettingsConfirmation: {
    ...confirmationDialogPresets.warning,
    title: 'Reset Settings',
    message: 'This will reset all your settings to their default values.',
    confirmText: 'Reset',
    cancelText: 'Cancel',
    confirmIcon: 'refresh-outline',
    cancelIcon: 'close-outline',
  },

  // Save workout confirmation
  saveWorkoutConfirmation: {
    ...confirmationDialogPresets.success,
    title: 'Save Workout',
    message: 'Your workout has been saved successfully!',
    confirmText: 'OK',
    confirmIcon: 'checkmark-outline',
  },

  // Create routine confirmation
  createRoutineConfirmation: {
    ...confirmationDialogPresets.success,
    title: 'Routine Created',
    message: 'Your workout routine has been created successfully!',
    confirmText: 'OK',
    confirmIcon: 'checkmark-outline',
  },

  // Update profile confirmation
  updateProfileConfirmation: {
    ...confirmationDialogPresets.success,
    title: 'Profile Updated',
    message: 'Your profile has been updated successfully!',
    confirmText: 'OK',
    confirmIcon: 'checkmark-outline',
  },

  // Permission request
  permissionRequest: {
    ...confirmationDialogPresets.info,
    title: 'Permission Required',
    message: 'This app needs access to your camera to take photos for your profile.',
    confirmText: 'Grant Permission',
    cancelText: 'Not Now',
    confirmIcon: 'camera-outline',
    cancelIcon: 'close-outline',
  },

  // Feature coming soon
  featureComingSoon: {
    ...confirmationDialogPresets.info,
    title: 'Coming Soon',
    message: 'This feature is currently under development and will be available soon.',
    confirmText: 'OK',
    confirmIcon: 'time-outline',
  },

  // Network error
  networkError: {
    ...confirmationDialogPresets.warning,
    title: 'Connection Error',
    message: 'Please check your internet connection and try again.',
    confirmText: 'Retry',
    cancelText: 'Cancel',
    confirmIcon: 'wifi-outline',
    cancelIcon: 'close-outline',
  },
};

// Helper function to get confirmation dialog configuration
export const getConfirmationDialogConfig = (type: keyof typeof confirmationDialogConfigs) => {
  return confirmationDialogConfigs[type];
};

// Helper function to create custom confirmation dialog configuration
export const createConfirmationDialogConfig = (
  baseType: keyof typeof confirmationDialogPresets,
  overrides: Partial<typeof confirmationDialogPresets[keyof typeof confirmationDialogPresets]> = {}
) => {
  return {
    ...confirmationDialogPresets[baseType],
    ...overrides,
  };
};

// Confirmation dialog utilities
export const confirmationDialogUtils = {
  // Get contextual confirmation based on action type
  getContextualConfirmation: (actionType: string, itemName?: string) => {
    const contextualConfirmations: Record<string, any> = {
      'delete': {
        ...confirmationDialogConfigs.deleteConfirmation,
        title: `Delete ${itemName || 'Item'}`,
        message: `Are you sure you want to delete ${itemName || 'this item'}? This action cannot be undone.`,
      },
      'logout': confirmationDialogConfigs.logoutConfirmation,
      'discard': confirmationDialogConfigs.discardChangesConfirmation,
      'clear': confirmationDialogConfigs.clearDataConfirmation,
      'reset': confirmationDialogConfigs.resetSettingsConfirmation,
      'save': confirmationDialogConfigs.saveWorkoutConfirmation,
      'create': confirmationDialogConfigs.createRoutineConfirmation,
      'update': confirmationDialogConfigs.updateProfileConfirmation,
      'permission': confirmationDialogConfigs.permissionRequest,
      'comingSoon': confirmationDialogConfigs.featureComingSoon,
      'network': confirmationDialogConfigs.networkError,
    };

    return contextualConfirmations[actionType] || confirmationDialogConfigs.deleteConfirmation;
  },

  // Get appropriate variant based on action type
  getVariantForAction: (actionType: string) => {
    const variantMap: Record<string, ConfirmationVariant> = {
      'delete': 'danger',
      'logout': 'warning',
      'discard': 'warning',
      'clear': 'danger',
      'reset': 'warning',
      'save': 'success',
      'create': 'success',
      'update': 'success',
      'permission': 'info',
      'comingSoon': 'info',
      'network': 'warning',
    };

    return variantMap[actionType] || 'default';
  },

  // Get appropriate size based on context
  getSizeForContext: (context: 'modal' | 'alert' | 'notification' | 'tooltip') => {
    const sizeMap: Record<string, ConfirmationSize> = {
      'modal': 'medium',
      'alert': 'small',
      'notification': 'small',
      'tooltip': 'small',
    };

    return sizeMap[context] || 'medium';
  },

  // Get appropriate icon based on action type
  getIconForAction: (actionType: string) => {
    const iconMap: Record<string, string> = {
      'delete': 'trash-outline',
      'logout': 'log-out-outline',
      'discard': 'close-outline',
      'clear': 'trash-outline',
      'reset': 'refresh-outline',
      'save': 'checkmark-outline',
      'create': 'add-circle-outline',
      'update': 'pencil-outline',
      'permission': 'key-outline',
      'comingSoon': 'time-outline',
      'network': 'wifi-outline',
    };

    return iconMap[actionType] || 'help-circle-outline';
  },
};

// Confirmation dialog animations
export const confirmationDialogAnimations = {
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

// Confirmation dialog colors
export const confirmationDialogColors = {
  primary: '#6366f1',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  muted: '#9ca3af',
  disabled: '#d1d5db',
};
