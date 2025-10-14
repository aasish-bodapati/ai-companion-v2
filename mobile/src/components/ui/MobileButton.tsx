/**
 * MobileButton - Optimized for one-handed use
 * Large touch targets, thumb-zone positioning, haptic feedback
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../theme/constants';

interface MobileButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function MobileButton({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
}: MobileButtonProps) {
  const handlePress = () => {
    if (disabled || loading) return;
    
    // Haptic feedback for better mobile UX
    hapticFeedback.light();
    onPress();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = [styles.button, styles[`${size}Button`]];
    
    if (fullWidth) {
      baseStyle.push(styles.fullWidth);
    }
    
    if (disabled || loading) {
      baseStyle.push(styles.disabledButton);
    } else {
      baseStyle.push(styles[`${variant}Button`]);
    }
    
    return StyleSheet.flatten([baseStyle, style]);
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle = [styles.text, styles[`${size}Text`]];
    
    if (disabled || loading) {
      baseStyle.push(styles.disabledText);
    } else {
      baseStyle.push(styles[`${variant}Text`]);
    }
    
    return StyleSheet.flatten([baseStyle, textStyle]);
  };

  const renderIcon = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={COLORS.white} />;
    }
    
    if (icon) {
      return (
        <Ionicons 
          name={icon} 
          size={size === 'small' ? 16 : size === 'medium' ? 20 : 24} 
          color={disabled ? COLORS.text.secondary : COLORS.white} 
        />
      );
    }
    
    return null;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {iconPosition === 'left' && renderIcon()}
      <Text style={getTextStyle()}>{title}</Text>
      {iconPosition === 'right' && renderIcon()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.medium,
    gap: SPACING.small,
  },
  
  // Sizes - optimized for thumb reach
  smallButton: {
    paddingVertical: SPACING.small,
    paddingHorizontal: SPACING.medium,
    minHeight: 44, // Minimum touch target size
  },
  mediumButton: {
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.large,
    minHeight: 48,
  },
  largeButton: {
    paddingVertical: SPACING.large,
    paddingHorizontal: SPACING.xl,
    minHeight: 56, // Large touch target for easy thumb access
  },
  
  // Variants
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dangerButton: {
    backgroundColor: COLORS.error,
  },
  successButton: {
    backgroundColor: COLORS.success,
  },
  disabledButton: {
    backgroundColor: COLORS.border,
  },
  
  // Layout
  fullWidth: {
    width: '100%',
  },
  
  // Text styles
  text: {
    fontWeight: FONT_WEIGHT.semibold,
    textAlign: 'center',
  },
  smallText: {
    fontSize: FONT_SIZE.small,
  },
  mediumText: {
    fontSize: FONT_SIZE.medium,
  },
  largeText: {
    fontSize: FONT_SIZE.large,
  },
  
  // Text variants
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.text.primary,
  },
  dangerText: {
    color: COLORS.white,
  },
  successText: {
    color: COLORS.white,
  },
  disabledText: {
    color: COLORS.text.secondary,
  },
});
