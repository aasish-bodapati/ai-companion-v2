import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/constants';
import { STYLE_PRESETS } from '../../theme/duplicateStyles';

export type InputType = 'text' | 'email' | 'password' | 'numeric' | 'phone' | 'search' | 'multiline';
export type InputSize = 'small' | 'medium' | 'large';
export type InputVariant = 'default' | 'outlined' | 'filled' | 'underlined';

interface UnifiedInputProps extends Omit<TextInputProps, 'onChangeText'> {
  // Core props
  value: string;
  onChangeText: (text: string) => void;
  type?: InputType;
  size?: InputSize;
  variant?: InputVariant;

  // Label and helper text
  label?: string;
  helperText?: string;
  errorText?: string;
  required?: boolean;

  // Input configuration
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;

  // Icons and actions
  icon?: string;
  iconPosition?: 'left' | 'right';
  onIconPress?: () => void;
  showClearButton?: boolean;
  onClear?: () => void;

  // Validation
  validation?: (value: string) => boolean;

  // Styling
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  labelStyle?: ViewStyle;

  // Callbacks
  onFocus?: () => void;
  onBlur?: () => void;

  testID?: string;
}

export default function UnifiedInput({
  value,
  onChangeText,
  type = 'text',
  size = 'medium',
  variant = 'outlined',
  label,
  helperText,
  errorText,
  required = false,
  placeholder,
  disabled = false,
  readonly = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  icon,
  iconPosition = 'left',
  onIconPress,
  showClearButton = false,
  onClear,
  validation,
  containerStyle,
  inputStyle,
  labelStyle,
  onFocus,
  onBlur,
  testID,
  ...textInputProps
}: UnifiedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(true);

  // Handle validation
  const validateValue = useCallback((val: string) => {
    if (validation) {
      const valid = validation(val);
      setIsValid(valid);
      return valid;
    }
    return true;
  }, [validation]);

  // Handle input changes
  const handleChangeText = useCallback((text: string) => {
    let processedText = text;

    // Type-specific processing
    switch (type) {
      case 'numeric':
        processedText = text.replace(/[^0-9.]/g, '');
        break;
      case 'phone':
        processedText = text.replace(/[^0-9+\-\(\)\s]/g, '');
        break;
      case 'email':
        processedText = text.toLowerCase();
        break;
    }

    // Apply max length
    if (maxLength && processedText.length > maxLength) {
      processedText = processedText.substring(0, maxLength);
    }

    onChangeText(processedText);
    validateValue(processedText);
  }, [onChangeText, type, maxLength, validateValue]);

  // Handle clear button
  const handleClear = useCallback(() => {
    onChangeText('');
    onClear?.();
    validateValue('');
  }, [onChangeText, onClear, validateValue]);

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
      case 'email': return 'email-address';
      case 'numeric': return 'numeric';
      case 'phone': return 'phone-pad';
      default: return 'default';
    }
  };

  // Get secure text entry
  const getSecureTextEntry = () => {
    return type === 'password';
  };

  // Get container styles
  const getContainerStyles = (): ViewStyle[] => {
    const baseStyles = [styles.container];

    // Variant styles
    switch (variant) {
      case 'outlined':
        baseStyles.push(styles.outlined);
        break;
      case 'filled':
        baseStyles.push(styles.filled);
        break;
      case 'underlined':
        baseStyles.push(styles.underlined);
        break;
      default:
        baseStyles.push(styles.default);
        break;
    }

    // Size styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.small);
        break;
      case 'medium':
        baseStyles.push(styles.medium);
        break;
      case 'large':
        baseStyles.push(styles.large);
        break;
    }

    // State styles
    if (isFocused) baseStyles.push(styles.focused);
    if (disabled) baseStyles.push(styles.disabled);
    if (readonly) baseStyles.push(styles.readonly);
    if (errorText || !isValid) baseStyles.push(styles.error);

    if (containerStyle) baseStyles.push(containerStyle);

    return baseStyles;
  };

  // Get input styles
  const getInputStyles = (): ViewStyle[] => {
    const baseStyles = [styles.input];

    if (multiline) baseStyles.push(styles.multiline);
    if (disabled) baseStyles.push(styles.inputDisabled);
    if (readonly) baseStyles.push(styles.inputReadonly);

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
          <TouchableOpacity
            onPress={onIconPress}
            style={styles.leftIcon}
            disabled={!onIconPress || disabled}
          >
            <Ionicons
              name={icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={disabled ? COLORS.text.disabled : COLORS.text.secondary}
            />
          </TouchableOpacity>
        )}

        {/* Text Input */}
        <TextInput
          {...textInputProps}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={COLORS.text.disabled}
          keyboardType={getKeyboardType()}
          secureTextEntry={getSecureTextEntry()}
          editable={!disabled && !readonly}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          style={getInputStyles()}
          testID={testID}
        />

        {/* Right Icon or Clear Button */}
        {showClearButton && value.length > 0 ? (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.rightIcon}
            disabled={disabled}
            testID={`${testID}-clear`}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={disabled ? COLORS.text.disabled : COLORS.text.secondary}
            />
          </TouchableOpacity>
        ) : icon && iconPosition === 'right' ? (
          <TouchableOpacity
            onPress={onIconPress}
            style={styles.rightIcon}
            disabled={!onIconPress || disabled}
          >
            <Ionicons
              name={icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={disabled ? COLORS.text.disabled : COLORS.text.secondary}
            />
          </TouchableOpacity>
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
    ...STYLE_PRESETS.row,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background.primary,
  },
  default: {
    borderColor: COLORS.border.primary,
  },
  outlined: {
    borderColor: COLORS.border.primary,
  },
  filled: {
    borderColor: 'transparent',
    backgroundColor: COLORS.background.secondary,
  },
  underlined: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
    backgroundColor: 'transparent',
    borderColor: COLORS.border.primary,
  },
  small: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  medium: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  large: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  focused: {
    borderColor: COLORS.primary.main,
    ...STYLE_PRESETS.shadowSmall,
  },
  disabled: {
    backgroundColor: COLORS.background.disabled,
    borderColor: COLORS.border.disabled,
  },
  readonly: {
    backgroundColor: COLORS.background.disabled,
  },
  error: {
    borderColor: COLORS.error,
  },
  label: {
    ...STYLE_PRESETS.textSecondary,
    marginBottom: SPACING.xs,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    ...STYLE_PRESETS.textPrimary,
    flex: 1,
    paddingVertical: 0,
  },
  multiline: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  inputDisabled: {
    color: COLORS.text.disabled,
  },
  inputReadonly: {
    color: COLORS.text.secondary,
  },
  leftIcon: {
    marginRight: SPACING.sm,
  },
  rightIcon: {
    marginLeft: SPACING.sm,
  },
  helperText: {
    ...STYLE_PRESETS.textCaption,
    marginTop: SPACING.xs,
  },
  errorText: {
    color: COLORS.error,
  },
});

// Export presets for common input configurations
export const inputPresets = {
  email: {
    type: 'email' as const,
    keyboardType: 'email-address' as const,
    autoCapitalize: 'none' as const,
    autoCorrect: false,
  },
  password: {
    type: 'password' as const,
    secureTextEntry: true,
    autoCapitalize: 'none' as const,
    autoCorrect: false,
  },
  numeric: {
    type: 'numeric' as const,
    keyboardType: 'numeric' as const,
  },
  phone: {
    type: 'phone' as const,
    keyboardType: 'phone-pad' as const,
  },
  search: {
    type: 'search' as const,
    icon: 'search' as const,
    showClearButton: true,
  },
  multiline: {
    type: 'text' as const,
    multiline: true,
    numberOfLines: 4,
  },
};
