/**
 * BaseCard - Standardized card component for consistent UI
 * Reduces complexity by providing a reusable base for all cards
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../theme/constants';

export interface BaseCardProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconSize?: number;
  showChevron?: boolean;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'outlined' | 'filled' | 'elevated';
  size?: 'small' | 'medium' | 'large';
}

export default function BaseCard({
  title,
  subtitle,
  children,
  onPress,
  onLongPress,
  style,
  titleStyle,
  subtitleStyle,
  icon,
  iconColor = COLORS.primary,
  iconSize = 20,
  showChevron = false,
  disabled = false,
  loading = false,
  variant = 'default',
  size = 'medium',
}: BaseCardProps) {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: COLORS.white,
      borderRadius: BORDER_RADIUS.medium,
      padding: SPACING.medium,
      ...SHADOWS.small,
    };

    // Size variants
    const sizeStyles = {
      small: { padding: SPACING.small },
      medium: { padding: SPACING.medium },
      large: { padding: SPACING.large },
    };

    // Variant styles
    const variantStyles = {
      default: { backgroundColor: COLORS.white },
      outlined: { 
        backgroundColor: 'transparent', 
        borderWidth: 1, 
        borderColor: COLORS.border 
      },
      filled: { backgroundColor: COLORS.background },
      elevated: { 
        backgroundColor: COLORS.white,
        ...SHADOWS.large,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getTitleStyle = (): TextStyle => {
    return {
      fontSize: FONT_SIZE.medium,
      fontWeight: FONT_WEIGHT.semibold,
      color: COLORS.text.primary,
      marginBottom: subtitle ? SPACING.xs : 0,
      ...titleStyle,
    };
  };

  const getSubtitleStyle = (): TextStyle => {
    return {
      fontSize: FONT_SIZE.small,
      fontWeight: FONT_WEIGHT.regular,
      color: COLORS.text.secondary,
      ...subtitleStyle,
    };
  };

  const CardContent = () => (
    <View style={styles.content}>
      {(title || icon) && (
        <View style={styles.header}>
          {icon && (
            <Ionicons 
              name={icon} 
              size={iconSize} 
              color={iconColor} 
              style={styles.icon}
            />
          )}
          <View style={styles.textContainer}>
            {title && <Text style={getTitleStyle()}>{title}</Text>}
            {subtitle && <Text style={getSubtitleStyle()}>{subtitle}</Text>}
          </View>
          {showChevron && (
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={COLORS.text.secondary}
            />
          )}
        </View>
      )}
      {children && <View style={styles.body}>{children}</View>}
    </View>
  );

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        style={[getCardStyle(), style]}
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled || loading}
        activeOpacity={0.7}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[getCardStyle(), style]}>
      <CardContent />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.small,
  },
  icon: {
    marginRight: SPACING.small,
  },
  textContainer: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
});
