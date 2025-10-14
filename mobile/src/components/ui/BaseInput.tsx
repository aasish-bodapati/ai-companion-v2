/**
 * BaseInput - Standardized input component for consistent forms
 * Reduces complexity by providing a reusable base for all inputs
 */

import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../theme/constants';

export interface BaseInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  helperStyle?: TextStyle;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}

const BaseInput = forwardRef<TextInput, BaseInputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  helperStyle,
  variant = 'default',
  size = 'medium',
  disabled = false,
  required = false,
  multiline = false,
  numberOfLines = 1,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      marginBottom: SPACING.medium,
    };

    return {
      ...baseStyle,
      ...containerStyle,
    };
  };

  const getInputContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: multiline ? 'flex-start' : 'center',
      borderRadius: BORDER_RADIUS.medium,
      borderWidth: 1,
      borderColor: error ? COLORS.error : isFocused ? COLORS.primary : COLORS.border,
      backgroundColor: COLORS.white,
    };

    // Size variants
    const sizeStyles = {
      small: {
        paddingHorizontal: SPACING.small,
        paddingVertical: SPACING.xs,
        minHeight: 36,
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
      default: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 2,
      },
      filled: {
        backgroundColor: COLORS.background,
        borderWidth: 0,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getInputStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      flex: 1,
      fontSize: FONT_SIZE.medium,
      color: COLORS.text.primary,
      paddingVertical: 0, // Remove default padding
    };

    // Size variants
    const sizeStyles = {
      small: { fontSize: FONT_SIZE.small },
      medium: { fontSize: FONT_SIZE.medium },
      large: { fontSize: FONT_SIZE.large },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...inputStyle,
    };
  };

  const getLabelStyle = (): TextStyle => {
    return {
      fontSize: FONT_SIZE.small,
      fontWeight: FONT_WEIGHT.medium,
      color: COLORS.text.primary,
      marginBottom: SPACING.xs,
      ...labelStyle,
    };
  };

  const getErrorStyle = (): TextStyle => {
    return {
      fontSize: FONT_SIZE.small,
      color: COLORS.error,
      marginTop: SPACING.xs,
      ...errorStyle,
    };
  };

  const getHelperStyle = (): TextStyle => {
    return {
      fontSize: FONT_SIZE.small,
      color: COLORS.text.secondary,
      marginTop: SPACING.xs,
      ...helperStyle,
    };
  };

  const handleFocus = () => {
    setIsFocused(true);
    props.onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    props.onBlur?.();
  };

  const renderLeftIcon = () => {
    if (!leftIcon) return null;
    
    return (
      <Ionicons
        name={leftIcon}
        size={20}
        color={isFocused ? COLORS.primary : COLORS.text.secondary}
        style={styles.leftIcon}
      />
    );
  };

  const renderRightIcon = () => {
    if (!rightIcon) return null;
    
    if (onRightIconPress) {
      return (
        <TouchableOpacity onPress={onRightIconPress} style={styles.rightIconContainer}>
          <Ionicons
            name={rightIcon}
            size={20}
            color={isFocused ? COLORS.primary : COLORS.text.secondary}
          />
        </TouchableOpacity>
      );
    }
    
    return (
      <Ionicons
        name={rightIcon}
        size={20}
        color={isFocused ? COLORS.primary : COLORS.text.secondary}
        style={styles.rightIcon}
      />
    );
  };

  return (
    <View style={getContainerStyle()}>
      {label && (
        <Text style={getLabelStyle()}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={getInputContainerStyle()}>
        {renderLeftIcon()}
        
        <TextInput
          ref={ref}
          style={getInputStyle()}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          {...props}
        />
        
        {renderRightIcon()}
      </View>
      
      {error && (
        <Text style={getErrorStyle()}>{error}</Text>
      )}
      
      {helperText && !error && (
        <Text style={getHelperStyle()}>{helperText}</Text>
      )}
    </View>
  );
});

BaseInput.displayName = 'BaseInput';

const styles = StyleSheet.create({
  leftIcon: {
    marginRight: SPACING.small,
  },
  rightIcon: {
    marginLeft: SPACING.small,
  },
  rightIconContainer: {
    marginLeft: SPACING.small,
    padding: SPACING.xs,
  },
  required: {
    color: COLORS.error,
  },
});

export default BaseInput;
