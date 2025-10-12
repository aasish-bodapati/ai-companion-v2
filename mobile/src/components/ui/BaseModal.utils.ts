// Utility functions and presets for BaseModal component

import { ModalSize, ModalPosition } from './BaseModal';


export const modalPresets = {
  // Small confirmation dialogs
  confirmation: {
    size: 'small' as ModalSize,
    position: 'center' as ModalPosition,
    showCloseButton: true,
    closeOnBackdrop: true,
    closeOnSwipe: false,
    scrollable: false,
    keyboardAvoiding: false,
    animationType: 'fade' as const,
  },

  // Medium forms and content
  form: {
    size: 'medium' as ModalSize,
    position: 'center' as ModalPosition,
    showCloseButton: true,
    closeOnBackdrop: false,
    closeOnSwipe: false,
    scrollable: true,
    keyboardAvoiding: true,
    animationType: 'slide' as const,
  },

  // Large content modals
  content: {
    size: 'large' as ModalSize,
    position: 'center' as ModalPosition,
    showCloseButton: true,
    closeOnBackdrop: true,
    closeOnSwipe: true,
    scrollable: true,
    keyboardAvoiding: true,
    animationType: 'slide' as const,
  },

  // Bottom sheet style
  bottomSheet: {
    size: 'medium' as ModalSize,
    position: 'bottom' as ModalPosition,
    showCloseButton: true,
    closeOnBackdrop: true,
    closeOnSwipe: true,
    scrollable: true,
    keyboardAvoiding: true,
    animationType: 'slide' as const,
  },

  // Full screen modals
  fullscreen: {
    size: 'fullscreen' as ModalSize,
    position: 'center' as ModalPosition,
    showCloseButton: true,
    closeOnBackdrop: false,
    closeOnSwipe: false,
    scrollable: true,
    keyboardAvoiding: true,
    animationType: 'fade' as const,
  },

  // Alert/notification style
  alert: {
    size: 'small' as ModalSize,
    position: 'top' as ModalPosition,
    showCloseButton: false,
    closeOnBackdrop: true,
    closeOnSwipe: false,
    scrollable: false,
    keyboardAvoiding: false,
    animationType: 'slide' as const,
  },
};

// Common modal configurations for specific use cases
export const modalConfigs = {
  // Workout logging modal
  workoutLogging: {
    ...modalPresets.form,
    title: 'Log Workout',
    size: 'large' as ModalSize,
  },

  // Routine creation modal
  routineCreation: {
    ...modalPresets.content,
    title: 'Create Routine',
    size: 'large' as ModalSize,
  },

  // Exercise selection modal
  exerciseSelection: {
    ...modalPresets.content,
    title: 'Select Exercise',
    size: 'medium' as ModalSize,
  },

  // Settings modal
  settings: {
    ...modalPresets.content,
    title: 'Settings',
    size: 'medium' as ModalSize,
  },

  // Confirmation dialog
  confirmation: {
    ...modalPresets.confirmation,
    title: 'Confirm Action',
  },

  // Error modal
  error: {
    ...modalPresets.alert,
    title: 'Error',
    size: 'small' as ModalSize,
  },

  // Success modal
  success: {
    ...modalPresets.alert,
    title: 'Success',
    size: 'small' as ModalSize,
  },
};

// Helper function to get modal configuration
export const getModalConfig = (type: keyof typeof modalConfigs) => {
  return modalConfigs[type];
};

// Helper function to create custom modal configuration
export const createModalConfig = (
  baseType: keyof typeof modalPresets,
  overrides: Partial<typeof modalPresets[keyof typeof modalPresets]> = {}
) => {
  return {
    ...modalPresets[baseType],
    ...overrides,
  };
};

// Common modal sizes for different screen sizes
export const responsiveModalSizes = {
  small: {
    width: '80%',
    maxHeight: '40%',
  },
  medium: {
    width: '90%',
    maxHeight: '70%',
  },
  large: {
    width: '95%',
    maxHeight: '85%',
  },
  fullscreen: {
    width: '100%',
    height: '100%',
  },
};

// Animation configurations
export const animationConfigs = {
  fast: {
    duration: 200,
  },
  normal: {
    duration: 300,
  },
  slow: {
    duration: 500,
  },
  spring: {
    duration: 400,
    useNativeDriver: true,
  },
};
