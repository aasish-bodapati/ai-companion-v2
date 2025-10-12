/**
 * Style utility functions for consistent component styling
 * These functions help reduce hardcoded values and provide reusable style patterns
 */

import { ViewStyle, TextStyle } from 'react-native';
import { COMMON_STYLES, COLORS, BORDER_RADIUS, SPACING, SHADOWS } from '../theme/constants';

/**
 * Get card style with different variants
 */
export const getCardStyle = (variant: 'default' | 'elevated' | 'flat' = 'default'): ViewStyle => {
  const base: ViewStyle = {
    backgroundColor: COMMON_STYLES.cardBackground,
    borderRadius: COMMON_STYLES.standardRadius,
    padding: SPACING.lg,
  };

  const variants = {
    default: { ...base, ...COMMON_STYLES.standardShadow },
    elevated: { ...base, ...COMMON_STYLES.elevatedShadow },
    flat: { ...base, shadowOpacity: 0, elevation: 0 },
  };

  return variants[variant];
};

/**
 * Get modal style with different sizes
 */
export const getModalStyle = (size: 'small' | 'medium' | 'large' = 'medium'): ViewStyle => {
  const base: ViewStyle = COMMON_STYLES.modalContentCenter;

  const sizes = {
    small: { ...base, width: '80%', height: '40%' },
    medium: { ...base, width: '90%', height: '60%' },
    large: { ...base, width: '95%', height: '80%' },
  };

  return sizes[size] as ViewStyle;
};

/**
 * Get loading container style
 */
export const getLoadingStyle = (): ViewStyle => {
  return COMMON_STYLES.loadingContainer;
};

/**
 * Get background style based on type
 */
export const getBackgroundStyle = (type: 'primary' | 'secondary' | 'tertiary' = 'secondary'): ViewStyle => {
  const backgrounds = {
    primary: { backgroundColor: COLORS.background.primary },
    secondary: { backgroundColor: COLORS.background.secondary },
    tertiary: { backgroundColor: COLORS.background.tertiary },
  };

  return backgrounds[type];
};

/**
 * Get border radius style
 */
export const getBorderRadiusStyle = (size: 'small' | 'medium' | 'large' | 'standard' = 'standard'): ViewStyle => {
  const radiuses = {
    small: { borderRadius: BORDER_RADIUS.sm },
    medium: { borderRadius: BORDER_RADIUS.md },
    large: { borderRadius: BORDER_RADIUS.lg },
    standard: { borderRadius: COMMON_STYLES.standardRadius },
  };

  return radiuses[size];
};

/**
 * Get shadow style
 */
export const getShadowStyle = (level: 'none' | 'small' | 'medium' | 'large' = 'small'): ViewStyle => {
  const shadows = {
    none: SHADOWS.none,
    small: SHADOWS.small,
    medium: SHADOWS.medium,
    large: SHADOWS.large,
  };

  return shadows[level];
};

/**
 * Get text style based on type
 */
export const getTextStyle = (type: 'primary' | 'secondary' | 'tertiary' | 'heading' | 'title' = 'primary'): TextStyle => {
  const textStyles = {
    primary: {
      color: COLORS.text.primary,
      fontSize: 16,
    },
    secondary: {
      color: COLORS.text.secondary,
      fontSize: 14,
    },
    tertiary: {
      color: COLORS.text.tertiary,
      fontSize: 12,
    },
    heading: {
      color: COLORS.text.primary,
      fontSize: 18,
      fontWeight: '600',
    },
    title: {
      color: COLORS.text.primary,
      fontSize: 20,
      fontWeight: 'bold',
    },
  };

  return textStyles[type] as TextStyle;
};

/**
 * Create a style object with common patterns
 */
export const createStyle = (options: {
  backgroundColor?: 'primary' | 'secondary' | 'tertiary';
  borderRadius?: 'small' | 'medium' | 'large' | 'standard';
  shadow?: 'none' | 'small' | 'medium' | 'large';
  padding?: 'small' | 'medium' | 'large';
}): ViewStyle => {
  const {
    backgroundColor = 'secondary',
    borderRadius = 'standard',
    shadow = 'small',
    padding = 'medium',
  } = options;

  const paddingValues = {
    small: SPACING.sm,
    medium: SPACING.lg,
    large: SPACING.xl,
  };

  return {
    ...getBackgroundStyle(backgroundColor),
    ...getBorderRadiusStyle(borderRadius),
    ...getShadowStyle(shadow),
    padding: paddingValues[padding],
  };
};
