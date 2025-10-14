/**
 * BaseForm - Standardized form component for consistent form handling
 * Reduces complexity by providing a reusable base for all forms
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
} from 'react-native';
import { COLORS, SPACING } from '../../theme/constants';

export interface FormField {
  name: string;
  required?: boolean;
  validate?: (value: any) => string | null;
}

export interface BaseFormProps {
  children: React.ReactNode;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  initialValues?: Record<string, any>;
  validationSchema?: Record<string, (value: any) => string | null>;
  fields?: FormField[];
  style?: ViewStyle;
  scrollable?: boolean;
  keyboardAvoidingView?: boolean;
  showValidationErrors?: boolean;
  submitOnEnter?: boolean;
  loading?: boolean;
}

export interface FormContextType {
  values: Record<string, any>;
  errors: Record<string, string>;
  setValue: (name: string, value: any) => void;
  setError: (name: string, error: string) => void;
  clearError: (name: string) => void;
  validateField: (name: string) => boolean;
  validateForm: () => boolean;
  reset: () => void;
  isSubmitting: boolean;
}

export const FormContext = React.createContext<FormContextType | null>(null);

export function useFormContext(): FormContextType {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a BaseForm');
  }
  return context;
}

export default function BaseForm({
  children,
  onSubmit,
  initialValues = {},
  validationSchema = {},
  fields = [],
  style,
  scrollable = true,
  keyboardAvoidingView = true,
  showValidationErrors = true,
  submitOnEnter = true,
  loading = false,
}: BaseFormProps) {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const setError = useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const clearError = useCallback((name: string) => {
    setErrors(prev => ({ ...prev, [name]: '' }));
  }, []);

  const validateField = useCallback((name: string): boolean => {
    const field = fields.find(f => f.name === name);
    const value = values[name];
    
    // Check required
    if (field?.required && (!value || value === '')) {
      setError(name, `${field.name} is required`);
      return false;
    }
    
    // Check custom validation
    if (field?.validate) {
      const error = field.validate(value);
      if (error) {
        setError(name, error);
        return false;
      }
    }
    
    // Check validation schema
    if (validationSchema[name]) {
      const error = validationSchema[name](value);
      if (error) {
        setError(name, error);
        return false;
      }
    }
    
    clearError(name);
    return true;
  }, [fields, values, validationSchema, setError, clearError]);

  const validateForm = useCallback((): boolean => {
    let isValid = true;
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      const value = values[field.name];
      
      // Check required
      if (field.required && (!value || value === '')) {
        newErrors[field.name] = `${field.name} is required`;
        isValid = false;
      }
      
      // Check custom validation
      if (field.validate) {
        const error = field.validate(value);
        if (error) {
          newErrors[field.name] = error;
          isValid = false;
        }
      }
      
      // Check validation schema
      if (validationSchema[field.name]) {
        const error = validationSchema[field.name](value);
        if (error) {
          newErrors[field.name] = error;
          isValid = false;
        }
      }
    });
    
    setErrors(newErrors);
    return isValid;
  }, [fields, values, validationSchema]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    
    const isValid = validateForm();
    if (!isValid) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, validateForm, onSubmit, values]);

  const contextValue: FormContextType = {
    values,
    errors,
    setValue,
    setError,
    clearError,
    validateField,
    validateForm,
    reset,
    isSubmitting: isSubmitting || loading,
  };

  const FormContent = () => (
    <FormContext.Provider value={contextValue}>
      <View style={[styles.form, style]}>
        {children}
      </View>
    </FormContext.Provider>
  );

  if (scrollable) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        enabled={keyboardAvoidingView}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FormContent />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      enabled={keyboardAvoidingView}
    >
      <FormContent />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    flex: 1,
    padding: SPACING.medium,
  },
});
