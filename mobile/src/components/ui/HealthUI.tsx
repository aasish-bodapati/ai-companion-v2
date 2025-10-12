
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';

import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme/constants';

// Base Card Component
interface HealthCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'small' | 'medium' | 'large';
  borderRadius?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  style?: Record<string, unknown>;
}

export function HealthCard({
  children,
  variant = 'default',
  padding = 'medium',
  borderRadius = 'medium',
  onPress,
  style,
}: HealthCardProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return styles.elevatedCard;
      case 'outlined':
        return styles.outlinedCard;
      case 'filled':
        return styles.filledCard;
      default:
        return styles.defaultCard;
    }
  };

  const getPaddingStyle = () => {
    switch (padding) {
      case 'small': return styles.smallPadding;
      case 'large': return styles.largePadding;
      default: return styles.mediumPadding;
    }
  };

  const getBorderRadiusStyle = () => {
    switch (borderRadius) {
      case 'small': return styles.smallBorderRadius;
      case 'large': return styles.largeBorderRadius;
      default: return styles.mediumBorderRadius;
    }
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[
        styles.card,
        getVariantStyle(),
        getPaddingStyle(),
        getBorderRadiusStyle(),
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </CardComponent>
  );
}

// Icon Button Component
interface HealthIconButtonProps {
  icon: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  onPress: () => void;
  disabled?: boolean;
  style?: Record<string, unknown>;
}

export function HealthIconButton({
  icon,
  size = FONT_SIZE.xl, // 24 -> FONT_SIZE.xl
  color = COLORS.text.secondary, // '#6b7280' -> COLORS.text.secondary
  backgroundColor = COLORS.background.secondary, // '#f8fafc' -> COLORS.background.secondary
  onPress,
  disabled = false,
  style,
}: HealthIconButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.iconButton,
        { backgroundColor: disabled ? COLORS.background.tertiary : backgroundColor }, // '#f3f4f6' -> COLORS.background.tertiary
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={size}
        color={disabled ? COLORS.text.tertiary : color} // '#9ca3af' -> COLORS.text.tertiary
      />
    </TouchableOpacity>
  );
}

// Badge Component
interface HealthBadgeProps {
  text: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  style?: Record<string, unknown>;
}

export function HealthBadge({
  text,
  variant = 'default',
  size = 'medium',
  style,
}: HealthBadgeProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'success':
        return styles.successBadge;
      case 'warning':
        return styles.warningBadge;
      case 'error':
        return styles.errorBadge;
      case 'info':
        return styles.infoBadge;
      default:
        return styles.defaultBadge;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small': return styles.smallBadge;
      case 'large': return styles.largeBadge;
      default: return styles.mediumBadge;
    }
  };

  return (
    <View style={[styles.badge, getVariantStyle(), getSizeStyle(), style]}>
      <Text style={[styles.badgeText, getVariantStyle()]}>{text}</Text>
    </View>
  );
}

// Divider Component
interface HealthDividerProps {
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
  color?: string;
  style?: Record<string, unknown>;
}

export function HealthDivider({
  orientation = 'horizontal',
  thickness = 1,
  color = COLORS.border.light, // '#e5e7eb' -> COLORS.border.light
  style,
}: HealthDividerProps) {
  return (
    <View
      style={[
        styles.divider,
        {
          [orientation === 'horizontal' ? 'height' : 'width']: thickness,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

// Loading Skeleton Component
interface HealthSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: Record<string, unknown>;
}

export function HealthSkeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}: HealthSkeletonProps) {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  // Card styles
  card: {
    backgroundColor: COLORS.background.primary, // '#ffffff' -> COLORS.background.primary
  },
  defaultCard: {
    ...SHADOWS.small, // Replaced individual shadow properties with SHADOWS.small
  },
  elevatedCard: {
    ...SHADOWS.medium, // Replaced individual shadow properties with SHADOWS.medium
  },
  outlinedCard: {
    borderWidth: 1,
    borderColor: COLORS.border.light, // '#e5e7eb' -> COLORS.border.light
    ...SHADOWS.none, // Replaced individual shadow properties with SHADOWS.none
  },
  filledCard: {
    backgroundColor: COLORS.background.secondary, // '#f8fafc' -> COLORS.background.secondary
    ...SHADOWS.none, // Replaced individual shadow properties with SHADOWS.none
  },
  smallPadding: { padding: SPACING.md }, // 12 -> SPACING.md
  mediumPadding: { padding: SPACING.lg }, // 16 -> SPACING.lg
  largePadding: { padding: SPACING.xl }, // 20 -> SPACING.xl
  smallBorderRadius: { borderRadius: BORDER_RADIUS.md }, // 8 -> BORDER_RADIUS.md
  mediumBorderRadius: { borderRadius: BORDER_RADIUS.lg }, // 12 -> BORDER_RADIUS.lg
  largeBorderRadius: { borderRadius: BORDER_RADIUS.xl }, // 16 -> BORDER_RADIUS.xl

  // Icon button styles
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Badge styles
  badge: {
    paddingHorizontal: SPACING.sm, // 8 -> SPACING.sm
    paddingVertical: SPACING.xs, // 4 -> SPACING.xs
    borderRadius: BORDER_RADIUS.lg, // 12 -> BORDER_RADIUS.lg
    alignSelf: 'flex-start',
  },
  defaultBadge: {
    backgroundColor: COLORS.background.tertiary, // '#f3f4f6' -> COLORS.background.tertiary
  },
  successBadge: {
    backgroundColor: COLORS.successLight, // '#d1fae5' -> COLORS.successLight
  },
  warningBadge: {
    backgroundColor: COLORS.warningLight, // '#fef3c7' -> COLORS.warningLight
  },
  errorBadge: {
    backgroundColor: COLORS.dangerLight, // '#fee2e2' -> COLORS.dangerLight
  },
  infoBadge: {
    backgroundColor: COLORS.info + '20', // '#dbeafe' -> COLORS.info with opacity
  },
  smallBadge: {
    paddingHorizontal: SPACING.xs, // 6 -> SPACING.xs
    paddingVertical: 2, // Keep as is for precise spacing
  },
  mediumBadge: {
    paddingHorizontal: SPACING.sm, // 8 -> SPACING.sm
    paddingVertical: SPACING.xs, // 4 -> SPACING.xs
  },
  largeBadge: {
    paddingHorizontal: SPACING.md, // 12 -> SPACING.md
    paddingVertical: SPACING.sm, // 6 -> SPACING.sm
  },
  badgeText: {
    fontSize: FONT_SIZE.sm, // 12 -> FONT_SIZE.sm
    fontWeight: FONT_WEIGHT.semibold, // '600' -> FONT_WEIGHT.semibold
    color: COLORS.text.secondary, // '#6b7280' -> COLORS.text.secondary
  },

  // Divider styles
  divider: {
    backgroundColor: COLORS.border.light, // '#e5e7eb' -> COLORS.border.light
  },

  // Skeleton styles
  skeleton: {
    backgroundColor: COLORS.background.tertiary, // '#f3f4f6' -> COLORS.background.tertiary
    opacity: 0.6,
  },
});
