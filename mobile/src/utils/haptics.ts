import * as Haptics from 'expo-haptics';

import { DebugUtils } from '../utils/debugUtils';

export const hapticFeedback = {
  // Light haptic feedback for subtle interactions
  light: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      DebugUtils.log('Haptic feedback not available:', error);
    }
  },

  // Medium haptic feedback for button presses
  medium: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      DebugUtils.log('Haptic feedback not available:', error);
    }
  },

  // Heavy haptic feedback for important actions
  heavy: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      DebugUtils.log('Haptic feedback not available:', error);
    }
  },

  // Success haptic feedback
  success: () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      DebugUtils.log('Haptic feedback not available:', error);
    }
  },

  // Warning haptic feedback
  warning: () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      DebugUtils.log('Haptic feedback not available:', error);
    }
  },

  // Error haptic feedback
  error: () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      DebugUtils.log('Haptic feedback not available:', error);
    }
  },

  // Selection haptic feedback
  selection: () => {
    try {
      Haptics.selectionAsync();
    } catch (error) {
      DebugUtils.log('Haptic feedback not available:', error);
    }
  },
};

// Touch interaction utilities
export const touchUtils = {
  // Minimum touch target size (44pt as per Apple HIG)
  MIN_TOUCH_TARGET_SIZE: 44,

  // Check if touch target meets minimum size requirements
  validateTouchTarget: (width: number, height: number): boolean => {
    return width >= touchUtils.MIN_TOUCH_TARGET_SIZE && height >= touchUtils.MIN_TOUCH_TARGET_SIZE;
  },

  // Get recommended touch target size
  getRecommendedSize: (contentSize: number): number => {
    return Math.max(contentSize, touchUtils.MIN_TOUCH_TARGET_SIZE);
  },

  // Calculate safe touch area with padding
  getSafeTouchArea: (contentSize: number, padding: number = 8): number => {
    return Math.max(contentSize + (padding * 2), touchUtils.MIN_TOUCH_TARGET_SIZE);
  },
};

// Animation utilities for mobile
export const hapticAnimationUtils = {
  // Standard animation durations
  durations: {
    fast: 150,
    normal: 250,
    slow: 350,
    verySlow: 500,
  },

  // Easing functions
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    linear: 'linear',
  },

  // Common animation configurations
  configs: {
    fadeIn: {
      duration: 250,
      easing: 'ease-out',
    },
    slideUp: {
      duration: 300,
      easing: 'ease-out',
    },
    scale: {
      duration: 200,
      easing: 'ease-out',
    },
    bounce: {
      duration: 400,
      easing: 'ease-out',
    },
  },
};

// Mobile-specific interaction helpers
export const mobileUtils = {
  // Check if device is in landscape mode
  isLandscape: (width: number, height: number): boolean => {
    return width > height;
  },

  // Get safe area insets (placeholder - would need react-native-safe-area-context)
  getSafeAreaInsets: () => {
    return {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    };
  },

  // Calculate responsive font size
  getResponsiveFontSize: (baseSize: number, screenWidth: number): number => {
    const scale = screenWidth / 375; // Base width (iPhone X)
    return Math.round(baseSize * scale);
  },

  // Calculate responsive spacing
  getResponsiveSpacing: (baseSpacing: number, screenWidth: number): number => {
    const scale = screenWidth / 375; // Base width (iPhone X)
    return Math.round(baseSpacing * scale);
  },
};
