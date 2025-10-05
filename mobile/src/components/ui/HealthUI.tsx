import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Base Card Component
interface HealthCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'small' | 'medium' | 'large';
  borderRadius?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  style?: any;
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
  style?: any;
}

export function HealthIconButton({
  icon,
  size = 24,
  color = '#6b7280',
  backgroundColor = '#f8fafc',
  onPress,
  disabled = false,
  style,
}: HealthIconButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.iconButton,
        { backgroundColor: disabled ? '#f3f4f6' : backgroundColor },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={icon as any} 
        size={size} 
        color={disabled ? '#9ca3af' : color} 
      />
    </TouchableOpacity>
  );
}

// Badge Component
interface HealthBadgeProps {
  text: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  style?: any;
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
  style?: any;
}

export function HealthDivider({
  orientation = 'horizontal',
  thickness = 1,
  color = '#e5e7eb',
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
  style?: any;
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
    backgroundColor: '#ffffff',
  },
  defaultCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  elevatedCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  outlinedCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowOpacity: 0,
    elevation: 0,
  },
  filledCard: {
    backgroundColor: '#f8fafc',
    shadowOpacity: 0,
    elevation: 0,
  },
  smallPadding: { padding: 12 },
  mediumPadding: { padding: 16 },
  largePadding: { padding: 20 },
  smallBorderRadius: { borderRadius: 8 },
  mediumBorderRadius: { borderRadius: 12 },
  largeBorderRadius: { borderRadius: 16 },

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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  defaultBadge: {
    backgroundColor: '#f3f4f6',
  },
  successBadge: {
    backgroundColor: '#d1fae5',
  },
  warningBadge: {
    backgroundColor: '#fef3c7',
  },
  errorBadge: {
    backgroundColor: '#fee2e2',
  },
  infoBadge: {
    backgroundColor: '#dbeafe',
  },
  smallBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mediumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  largeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },

  // Divider styles
  divider: {
    backgroundColor: '#e5e7eb',
  },

  // Skeleton styles
  skeleton: {
    backgroundColor: '#f3f4f6',
    opacity: 0.6,
  },
});
