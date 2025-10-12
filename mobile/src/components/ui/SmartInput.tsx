import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme/constants';

export type InputType = 'text' | 'numeric' | 'search' | 'email' | 'password';
export type InputSize = 'small' | 'medium' | 'large';

interface SmartInputProps extends Omit<TextInputProps, 'onChangeText'> {
  // Core props
  value: string;
  onChangeText: (value: string) => void;
  type?: InputType;
  size?: InputSize;
  
  // Label and placeholder
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  
  // Validation
  validation?: (value: string) => boolean;
  required?: boolean;
  
  // Formatting
  format?: (value: string) => string;
  parse?: (value: string) => string;
  
  // UI customization
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  showClearButton?: boolean;
  disabled?: boolean;
  
  // Styling
  containerStyle?: any;
  inputStyle?: any;
  labelStyle?: any;
  
  // Callbacks
  onFocus?: () => void;
  onBlur?: () => void;
  onClear?: () => void;
}

export default function SmartInput({
  value,
  onChangeText,
  type = 'text',
  size = 'medium',
  label,
  placeholder,
  helperText,
  errorText,
  validation,
  required = false,
  format,
  parse,
  icon,
  iconPosition = 'left',
  showClearButton = false,
  disabled = false,
  containerStyle,
  inputStyle,
  labelStyle,
  onFocus,
  onBlur,
  onClear,
  ...textInputProps
}: SmartInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [internalValue, setInternalValue] = useState(value);

  // Update internal value when prop changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Handle validation
  useEffect(() => {
    if (validation) {
      setIsValid(validation(internalValue));
    }
  }, [internalValue, validation]);

  // Handle input changes
  const handleChangeText = useCallback((text: string) => {
    let processedText = text;
    
    // Apply parsing if provided
    if (parse) {
      processedText = parse(text);
    }
    
    // Apply formatting if provided
    if (format) {
      processedText = format(processedText);
    }
    
    // Type-specific processing
    if (type === 'numeric') {
      // Only allow numbers and decimal point
      processedText = processedText.replace(/[^0-9.]/g, '');
    }
    
    setInternalValue(processedText);
    onChangeText(processedText);
  }, [onChangeText, type, format, parse]);

  // Handle clear button
  const handleClear = useCallback(() => {
    setInternalValue('');
    onChangeText('');
    onClear?.();
  }, [onChangeText, onClear]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  // Get keyboard type based on input type
  const getKeyboardType = () => {
    switch (type) {
      case 'numeric':
        return 'numeric';
      case 'email':
        return 'email-address';
      default:
        return 'default';
    }
  };

  // Get secure text entry for password
  const getSecureTextEntry = () => {
    return type === 'password';
  };

  // Get container styles
  const getContainerStyles = () => {
    const baseStyles = [styles.container];
    
    if (size === 'small') baseStyles.push(styles.containerSmall);
    if (size === 'large') baseStyles.push(styles.containerLarge);
    
    if (disabled) baseStyles.push(styles.containerDisabled);
    if (isFocused) baseStyles.push(styles.containerFocused);
    if (errorText || !isValid) baseStyles.push(styles.containerError);
    
    if (containerStyle) baseStyles.push(containerStyle);
    
    return baseStyles;
  };

  // Get input styles
  const getInputStyles = () => {
    const baseStyles = [styles.input];
    
    if (size === 'small') baseStyles.push(styles.inputSmall);
    if (size === 'large') baseStyles.push(styles.inputLarge);
    
    if (disabled) baseStyles.push(styles.inputDisabled);
    if (icon && iconPosition === 'left') baseStyles.push(styles.inputWithLeftIcon);
    if (showClearButton || (icon && iconPosition === 'right')) baseStyles.push(styles.inputWithRightIcon);
    
    if (inputStyle) baseStyles.push(inputStyle);
    
    return baseStyles;
  };

  return (
    <View style={styles.wrapper}>
      {/* Label */}
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      {/* Input Container */}
      <View style={getContainerStyles()}>
        {/* Left Icon */}
        {icon && iconPosition === 'left' && (
          <Ionicons
            name={icon}
            size={20}
            color={disabled ? COLORS.text.disabled : COLORS.text.secondary}
            style={styles.leftIcon}
          />
        )}
        
        {/* Text Input */}
        <TextInput
          {...textInputProps}
          value={internalValue}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={COLORS.text.disabled}
          keyboardType={getKeyboardType()}
          secureTextEntry={getSecureTextEntry()}
          editable={!disabled}
          style={getInputStyles()}
        />
        
        {/* Right Icon or Clear Button */}
        {showClearButton && internalValue.length > 0 ? (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.rightIcon}
            disabled={disabled}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={disabled ? COLORS.text.disabled : COLORS.text.secondary}
            />
          </TouchableOpacity>
        ) : icon && iconPosition === 'right' ? (
          <Ionicons
            name={icon}
            size={20}
            color={disabled ? COLORS.text.disabled : COLORS.text.secondary}
            style={styles.rightIcon}
          />
        ) : null}
      </View>
      
      {/* Helper Text or Error Text */}
      {(helperText || errorText || (!isValid && validation)) && (
        <Text style={[
          styles.helperText,
          (errorText || !isValid) && styles.errorText
        ]}>
          {errorText || (!isValid && validation ? 'Invalid input' : helperText)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background.primary,
    minHeight: 48,
  },
  containerSmall: {
    minHeight: 40,
  },
  containerLarge: {
    minHeight: 56,
  },
  containerDisabled: {
    backgroundColor: COLORS.background.disabled,
    borderColor: COLORS.border.disabled,
  },
  containerFocused: {
    borderColor: COLORS.primary.main,
    borderWidth: 2,
  },
  containerError: {
    borderColor: COLORS.error.main,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  inputSmall: {
    fontSize: FONT_SIZE.sm,
    paddingHorizontal: SPACING.sm,
  },
  inputLarge: {
    fontSize: FONT_SIZE.lg,
    paddingHorizontal: SPACING.lg,
  },
  inputDisabled: {
    color: COLORS.text.disabled,
  },
  inputWithLeftIcon: {
    paddingLeft: SPACING.sm,
  },
  inputWithRightIcon: {
    paddingRight: SPACING.sm,
  },
  leftIcon: {
    marginLeft: SPACING.md,
  },
  rightIcon: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  required: {
    color: COLORS.error.main,
  },
  helperText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  errorText: {
    color: COLORS.error.main,
  },
});
