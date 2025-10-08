import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme/constants';

interface NumericInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label?: string;
  value: number | string;
  onChangeText: (value: number) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  allowDecimals?: boolean;
  min?: number;
  max?: number;
  suffix?: string;
  prefix?: string;
  containerStyle?: Record<string, unknown>;
  inputStyle?: Record<string, unknown>;
  labelStyle?: Record<string, unknown>;
}

export default function NumericInput({
  label,
  value,
  onChangeText,
  error,
  helperText,
  required = false,
  allowDecimals = false,
  min,
  max,
  suffix,
  prefix,
  containerStyle,
  inputStyle,
  labelStyle,
  placeholder = '0',
  ...textInputProps
}: NumericInputProps) {
  
  const handleTextChange = (text: string) => {
    // Remove all non-numeric characters except decimal point if allowed
    let numericValue = text;
    
    if (allowDecimals) {
      // Allow numbers and one decimal point
      numericValue = text.replace(/[^0-9.]/g, '');
      // Ensure only one decimal point
      const parts = numericValue.split('.');
      if (parts.length > 2) {
        numericValue = parts[0] + '.' + parts.slice(1).join('');
      }
    } else {
      // Only allow integers
      numericValue = text.replace(/[^0-9]/g, '');
    }
    
    // Convert to number
    const numberValue = numericValue === '' ? 0 : (allowDecimals ? parseFloat(numericValue) : parseInt(numericValue, 10));
    
    // Apply min/max constraints
    let constrainedValue = numberValue;
    if (min !== undefined && constrainedValue < min) {
      constrainedValue = min;
    }
    if (max !== undefined && constrainedValue > max) {
      constrainedValue = max;
    }
    
    onChangeText(constrainedValue);
  };

  const displayValue = () => {
    if (value === 0 || value === '0') return '';
    return value.toString();
  };

  const getInputStyle = () => {
    return [
      styles.input,
      error && styles.inputError,
      inputStyle,
    ];
  };

  const renderPrefix = () => {
    if (!prefix) return null;
    return <Text style={styles.affix}>{prefix}</Text>;
  };

  const renderSuffix = () => {
    if (!suffix) return null;
    return <Text style={styles.affix}>{suffix}</Text>;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={styles.inputContainer}>
        {renderPrefix()}
        <TextInput
          style={getInputStyle()}
          value={displayValue()}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.text.tertiary}
          keyboardType={allowDecimals ? 'decimal-pad' : 'numeric'}
          selectTextOnFocus
          {...textInputProps}
        />
        {renderSuffix()}
      </View>

      {(error || helperText) && (
        <Text style={[styles.helperText, error ? styles.errorText : null]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  required: {
    color: COLORS.danger,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background.primary,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text.primary,
    paddingVertical: SPACING.md,
    textAlign: 'center',
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  affix: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  helperText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  errorText: {
    color: COLORS.danger,
  },
});
