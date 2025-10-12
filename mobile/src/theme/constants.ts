// Theme constants for consistent styling across the mobile app
import { ViewStyle, TextStyle } from 'react-native';

export const COLORS = {
  // Primary colors
  primary: {
    main: '#3b82f6',
    light: '#60a5fa',
    dark: '#1e40af',
  },

  // Semantic colors
  success: '#10b981',
  successLight: '#34d399',
  successDark: '#059669',

  warning: '#f59e0b',
  warningLight: '#fbbf24',
  warningDark: '#d97706',

  danger: '#ef4444',
  dangerLight: '#f87171',
  dangerDark: '#dc2626',

  // Gray scale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f3f4f6',
    disabled: '#f3f4f6',
  },

  // Text colors
  text: {
    primary: '#1f2937',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    inverse: '#ffffff',
    disabled: '#9ca3af',
  },

  // Border colors
  border: {
    light: '#e5e7eb',
    medium: '#d1d5db',
    dark: '#9ca3af',
    primary: '#d1d5db',
    disabled: '#d1d5db',
  },

  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  backdropLight: 'rgba(0, 0, 0, 0.3)',

  // Additional colors
  error: {
    main: '#ef4444',
  },
  info: '#3b82f6',
  disabled: '#9ca3af',
  
  // Missing properties
  accent: '#8b5cf6', // Purple accent color
  placeholder: '#9ca3af', // Placeholder text color
};

export const SPACING = {
  xxs: 2,  // Extra extra small
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  xxxxxl: 48,
  // Additional spacing
  small: 8,
  medium: 16,
  large: 24,
  full: 100, // Full width/height
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  round: 50,
  pill: 999, // Pill shape for buttons
  // Additional border radius
  small: 4,
  medium: 8,
  large: 12,
};

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  xxxxl: 28,
  xxxxxl: 32,
  // Additional font sizes
  small: 12,
  medium: 14,
  large: 18,
};

export const FONT_WEIGHT = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },

  xlarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Common style patterns for frequently used combinations
export const COMMON_STYLES = {
  // Background patterns (using existing color constants)
  secondaryBackground: COLORS.background.secondary, // '#f8fafc'
  cardBackground: COLORS.background.primary, // '#ffffff'
  modalBackground: COLORS.background.primary, // '#ffffff'

  // Border patterns (using existing radius constants)
  standardRadius: BORDER_RADIUS.lg, // 12
  smallRadius: BORDER_RADIUS.md, // 8
  largeRadius: BORDER_RADIUS.xl, // 16

  // Shadow patterns (using existing shadow constants)
  standardShadow: SHADOWS.small,
  elevatedShadow: SHADOWS.medium,

  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
  } as ViewStyle,

  // Modal patterns (extending existing modal styles)
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  modalContentCenter: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.large,
  } as ViewStyle,
};

// Common style mixins
export const MIXINS = {
  // Card styles
  card: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  } as ViewStyle,

  cardSmall: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.small,
  } as ViewStyle,

  // Button styles
  buttonBase: {
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Touch target size
  } as ViewStyle,

  // Input styles
  inputBase: {
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.primary,
    minHeight: 44, // Touch target size
  } as ViewStyle,

  // Text styles
  textPrimary: {
    color: COLORS.text.primary,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.normal,
  } as TextStyle,

  textSecondary: {
    color: COLORS.text.secondary,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.normal,
  } as TextStyle,

  textHeading: {
    color: COLORS.text.primary,
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.semibold,
  } as TextStyle,

  textTitle: {
    color: COLORS.text.primary,
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
  } as TextStyle,

  // Layout styles
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,

  rowSpaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  } as ViewStyle,

  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  } as ViewStyle,

  modalContent: {
    backgroundColor: COLORS.background.primary,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    ...SHADOWS.xlarge,
  } as ViewStyle,
};

// Animation durations
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// Touch target sizes (accessibility)
export const TOUCH_TARGET = {
  minSize: 44,
  comfortable: 48,
  large: 56,
};

// Breakpoints for responsive design
export const BREAKPOINTS = {
  small: 320,
  medium: 768,
  large: 1024,
};

export default {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOWS,
  COMMON_STYLES,
  MIXINS,
  ANIMATION,
  TOUCH_TARGET,
  BREAKPOINTS,
};
