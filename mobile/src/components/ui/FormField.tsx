import React from 'react';
import { View, StyleSheet } from 'react-native';
import MobileOptimizedInput from './MobileOptimizedInput';

export interface FormFieldProps {
  name: string;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  icon?: string;
  onIconPress?: () => void;
  variant?: 'default' | 'outlined' | 'filled' | 'underlined';
  size?: 'small' | 'medium' | 'large';
  containerStyle?: Record<string, unknown>;
  testID?: string;
}

export default function FormField({
  name,
  label,
  value,
  onChangeText,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  icon,
  onIconPress,
  variant = 'outlined',
  size = 'medium',
  containerStyle,
  testID,
}: FormFieldProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <MobileOptimizedInput
        label={label + (required ? ' *' : '')}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        error={error}
        helperText={helperText}
        disabled={disabled}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        icon={icon}
        onIconPress={onIconPress}
        variant={variant}
        size={size}
        testID={testID || name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.medium,
  },
});
