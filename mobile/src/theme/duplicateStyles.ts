/**
 * Comprehensive Style Presets System
 * Replaces hardcoded values with theme-consistent presets
 * Based on audit findings: 328 background colors, 334 border radius, 636 padding values
 */

import { ViewStyle, TextStyle } from 'react-native';

import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from './constants';

// ============================================================================
// COMMON HARDCODED VALUES FOUND IN AUDIT
// ============================================================================

export const HARDCODED_VALUES = {
  // Background colors (found 328+ times)
  BACKGROUNDS: {
    WHITE: '#ffffff',
    F8FAFC: '#f8fafc',
    F3F4F6: '#f3f4f6',
    E5E7EB: '#e5e7eb',
    D1D5DB: '#d1d5db',
    PRIMARY: '#3b82f6',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
  },

  // Border radius (found 334+ times)
  RADIUS: {
    ROUND: 50,
    LARGE: 20,
    MEDIUM: 16,
    SMALL: 12,
    XS: 8,
    XXS: 4,
  },

  // Padding values (found 636+ times)
  PADDING: {
    XL: 24,
    L: 20,
    M: 16,
    S: 12,
    XS: 8,
    XXS: 4,
  },

  // Font sizes (found 110+ times)
  FONTS: {
    XXL: 28,
    XL: 20,
    L: 18,
    M: 16,
    S: 14,
    XS: 12,
    XXS: 10,
  },

  // Text colors
  TEXT: {
    PRIMARY: '#1f2937',
    SECONDARY: '#6b7280',
    TERTIARY: '#9ca3af',
    WHITE: '#ffffff',
  },
};

// ============================================================================
// STYLE PRESETS - COMPREHENSIVE COMPONENT PATTERNS
// ============================================================================

export const STYLE_PRESETS = {
  // ===== CONTAINER PATTERNS =====
  screen: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  } as ViewStyle,

  screenWhite: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  } as ViewStyle,

  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,

  // ===== CARD PATTERNS =====
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

  cardLarge: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.large,
  } as ViewStyle,

  cardSecondary: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  } as ViewStyle,

  // ===== BUTTON PATTERNS =====
  buttonPrimary: {
    backgroundColor: COLORS.primary.main,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  } as ViewStyle,

  buttonSecondary: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    minHeight: 44,
  } as ViewStyle,

  buttonSuccess: {
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  } as ViewStyle,

  buttonDanger: {
    backgroundColor: COLORS.danger,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  } as ViewStyle,

  buttonSmall: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    minHeight: 36,
  } as ViewStyle,

  // ===== INPUT PATTERNS =====
  input: {
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.primary,
    minHeight: 44,
  } as ViewStyle,

  inputFocused: {
    borderColor: COLORS.primary.main,
    borderWidth: 2,
  } as ViewStyle,

  inputError: {
    borderColor: COLORS.danger,
    borderWidth: 2,
  } as ViewStyle,

  inputDisabled: {
    backgroundColor: COLORS.background.disabled,
    color: COLORS.text.disabled,
    borderColor: COLORS.border.disabled,
  } as ViewStyle,

  // ===== TEXT PATTERNS =====
  textTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text.primary,
  } as TextStyle,

  textHeading: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text.primary,
  } as TextStyle,

  textSubheading: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.text.primary,
  } as TextStyle,

  textBody: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.normal,
    color: COLORS.text.primary,
  } as TextStyle,

  textSecondary: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.normal,
    color: COLORS.text.secondary,
  } as TextStyle,

  textCaption: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.normal,
    color: COLORS.text.tertiary,
  } as TextStyle,

  textButton: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text.inverse,
  } as TextStyle,

  textButtonSecondary: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text.primary,
  } as TextStyle,

  // ===== LAYOUT PATTERNS =====
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,

  rowSpaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,

  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  column: {
    flexDirection: 'column',
  } as ViewStyle,

  columnCenter: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // ===== MODAL PATTERNS =====
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  modalOverlayBottom: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  } as ViewStyle,

  modalContent: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.large,
    maxWidth: '90%',
    maxHeight: '80%',
  } as ViewStyle,

  modalContentBottom: {
    backgroundColor: COLORS.background.primary,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    ...SHADOWS.xlarge,
  } as ViewStyle,

  // ===== BADGE PATTERNS =====
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  badgePrimary: {
    backgroundColor: COLORS.primary.main,
  } as ViewStyle,

  badgeSuccess: {
    backgroundColor: COLORS.success,
  } as ViewStyle,

  badgeWarning: {
    backgroundColor: COLORS.warning,
  } as ViewStyle,

  badgeDanger: {
    backgroundColor: COLORS.danger,
  } as ViewStyle,

  badgeSecondary: {
    backgroundColor: COLORS.gray[200],
  } as ViewStyle,

  // ===== DIVIDER PATTERNS =====
  divider: {
    height: 1,
    backgroundColor: COLORS.border.light,
  } as ViewStyle,

  dividerThick: {
    height: 2,
    backgroundColor: COLORS.border.primary,
  } as ViewStyle,

  // ===== LOADING PATTERNS =====
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
  } as ViewStyle,

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a style preset by name
 */
export const getStylePreset = <T extends keyof typeof STYLE_PRESETS>(
  presetName: T
): typeof STYLE_PRESETS[T] => {
  return STYLE_PRESETS[presetName];
};

/**
 * Combine multiple style presets
 */
export const combineStyles = (...styles: (ViewStyle | TextStyle)[]): ViewStyle | TextStyle => {
  return Object.assign({}, ...styles);
};

/**
 * Create a variant of a style preset
 */
export const createStyleVariant = (
  baseStyle: ViewStyle | TextStyle,
  overrides: Partial<ViewStyle | TextStyle>
): ViewStyle | TextStyle => {
  return { ...baseStyle, ...overrides };
};

/**
 * Get responsive styles based on screen size
 */
export const getResponsiveStyle = (
  small: ViewStyle | TextStyle,
  medium?: ViewStyle | TextStyle,
  large?: ViewStyle | TextStyle
) => {
  // For now, return small - can be enhanced with actual responsive logic
  return small;
};

/**
 * Create a style with conditional properties
 */
export const createConditionalStyle = (
  baseStyle: ViewStyle | TextStyle,
  condition: boolean,
  conditionalStyle: ViewStyle | TextStyle
): ViewStyle | TextStyle => {
  return condition ? { ...baseStyle, ...conditionalStyle } : baseStyle;
};

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Map hardcoded values to theme constants
 */
export const mapHardcodedValue = (value: string | number): string | number => {
  const valueMap: Record<string, string | number> = {
    // Background colors
    '#ffffff': COLORS.background.primary,
    '#f8fafc': COLORS.background.secondary,
    '#f3f4f6': COLORS.background.tertiary,
    '#e5e7eb': COLORS.gray[200],
    '#d1d5db': COLORS.gray[300],
    '#3b82f6': COLORS.primary.main,
    '#10b981': COLORS.success,
    '#f59e0b': COLORS.warning,
    '#ef4444': COLORS.danger,

    // Text colors
    '#1f2937': COLORS.text.primary,
    '#6b7280': COLORS.text.secondary,
    '#9ca3af': COLORS.text.tertiary,

    // Border radius
    '50px': BORDER_RADIUS.round,
    '20px': BORDER_RADIUS.xxl,
    '16px': BORDER_RADIUS.lg,
    '12px': BORDER_RADIUS.md,
    '8px': BORDER_RADIUS.sm,
    '4px': BORDER_RADIUS.sm,

    // Padding
    '24px': SPACING.xl,
    '20px-padding': SPACING.lg,
    '16px-padding': SPACING.md,
    '12px-padding': SPACING.sm,
    '8px-padding': SPACING.xs,
    '4px-padding': SPACING.xs,

    // Font sizes
    '28px': FONT_SIZE.xxxxl,
    '20px-font': FONT_SIZE.xxl,
    '18px': FONT_SIZE.xl,
    '16px-font': FONT_SIZE.lg,
    '14px': FONT_SIZE.md,
    '12px-font': FONT_SIZE.sm,
    '10px': FONT_SIZE.xs,
  };

  return valueMap[value.toString()] || value;
};

/**
 * Replace hardcoded values in a style object
 */
export const replaceHardcodedValues = (style: Record<string, any>): Record<string, any> => {
  const newStyle = { ...style };

  Object.keys(newStyle).forEach(key => {
    if (typeof newStyle[key] === 'string' || typeof newStyle[key] === 'number') {
      newStyle[key] = mapHardcodedValue(newStyle[key]);
    }
  });

  return newStyle;
};

// ============================================================================
// LEGACY SUPPORT (for backward compatibility)
// ============================================================================

export const DUPLICATE_STYLES = HARDCODED_VALUES;
export const getCommonStyle = getStylePreset;
export const replaceHardcodedStyle = replaceHardcodedValues;
