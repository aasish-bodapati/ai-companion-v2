/**
 * BaseButton - Standardized button component for consistent UI
 * Reduces complexity by providing a reusable base for all buttons
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../theme/constants';

export interface BaseButtonProps {
  title: string;
  onPress: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  iconColor?: string;
  iconSize?: number;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  hapticFeedback?: boolean;
}

export default function BaseButton({
  title,
  onPress,
  onLongPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  iconColor,
  iconSize = 16,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  hapticFeedback = true,
}: BaseButtonProps) {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BORDER_RADIUS.medium,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
    };

    // Size variants
    const sizeStyles = {
      small: {
        paddingHorizontal: SPACING.small,
        paddingVertical: SPACING.xs,
        minHeight: 32,
      },
      medium: {
        paddingHorizontal: SPACING.medium,
        paddingVertical: SPACING.small,
        minHeight: 44,
      },
      large: {
        paddingHorizontal: SPACING.large,
        paddingVertical: SPACING.medium,
        minHeight: 52,
      },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: COLORS.primary,
        borderWidth: 0,
      },
      secondary: {
        backgroundColor: COLORS.secondary,
        borderWidth: 0,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      danger: {
        backgroundColor: COLORS.error,
        borderWidth: 0,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled || loading ? 0.6 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: FONT_WEIGHT.semibold,
      textAlign: 'center',
    };

    // Size variants
    const sizeStyles = {
      small: { fontSize: FONT_SIZE.small },
      medium: { fontSize: FONT_SIZE.medium },
      large: { fontSize: FONT_SIZE.large },
    };

    // Variant styles
    const variantStyles = {
      primary: { color: COLORS.white },
      secondary: { color: COLORS.white },
      outline: { color: COLORS.primary },
      ghost: { color: COLORS.primary },
      danger: { color: COLORS.white },
    };

    return {
      ...baseTextStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...textStyle,
    };
  };

  const getIconColor = (): string => {
    if (iconColor) return iconColor;
    
    const variantColors = {
      primary: COLORS.white,
      secondary: COLORS.white,
      outline: COLORS.primary,
      ghost: COLORS.primary,
      danger: COLORS.white,
    };
    
    return variantColors[variant];
  };

  const handlePress = () => {
    if (disabled || loading) return;
    
    if (hapticFeedback) {
      // Add haptic feedback here if needed
    }
    
    onPress();
  };

  const renderIcon = () => {
    if (!icon || loading) return null;
    
    return (
      <Ionicons
        name={icon}
        size={iconSize}
        color={getIconColor()}
        style={[
          styles.icon,
          iconPosition === 'left' ? styles.iconLeft : styles.iconRight,
        ]}
      />
    );
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={handlePress}
      onLongPress={onLongPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={getIconColor()} 
          style={styles.loader}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && renderIcon()}
          <Text style={getTextStyle()}>{title}</Text>
          {icon && iconPosition === 'right' && renderIcon()}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  icon: {
    marginHorizontal: SPACING.xs,
  },
  iconLeft: {
    marginRight: SPACING.xs,
    marginLeft: 0,
  },
  iconRight: {
    marginLeft: SPACING.xs,
    marginRight: 0,
  },
  loader: {
    marginHorizontal: SPACING.xs,
  },
});
