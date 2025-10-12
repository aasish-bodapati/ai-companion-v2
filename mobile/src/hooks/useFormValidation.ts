import { useState, useCallback, useMemo } from 'react';

import { FormValidator, ValidationRule, ValidationErrors } from '../utils/formValidation';
import { FormState } from '../types/CommonTypes';

/**
 * Custom hook for form validation and state management
 * Reduces code duplication across form components
 */
export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  validationRules: Record<keyof T, ValidationRule[]>
) {
  const [formState, setFormState] = useState<FormState<T>>({
    data: initialData,
    errors: {},
    isSubmitting: false,
    isValid: false,
    isDirty: false,
  });

  const validator = useMemo(() => {
    // Convert ValidationRule[] to ValidationRules format
    const rules: Record<string, ValidationRule> = {};
    Object.keys(validationRules).forEach(field => {
      const fieldRules = validationRules[field as keyof T];
      if (fieldRules && fieldRules.length > 0) {
        rules[field as string] = fieldRules[0]; // Use first rule for now
      }
    });
    return new FormValidator(rules);
  }, [validationRules]);

  // Validate a single field
  const validateField = useCallback((field: keyof T, value: unknown): string | undefined => {
    const fieldRules = validationRules[field];
    if (!fieldRules) return undefined;

    for (const rule of fieldRules) {
      const error = validator.validateField(field as string, value);
      if (error) return error;
    }
    return undefined;
  }, [validator, validationRules]);

  // Validate all fields
  const validateForm = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {};

    Object.keys(validationRules).forEach(field => {
      const fieldRules = validationRules[field as keyof T];
      if (!fieldRules) return;

      for (const rule of fieldRules) {
        const error = validator.validateField(field, formState.data[field as keyof T]);
        if (error) {
          errors[field] = error;
          break; // Stop at first error for this field
        }
      }
    });

    return errors;
  }, [validator, validationRules, formState.data]);

  // Update field value
  const updateField = useCallback((field: keyof T, value: unknown) => {
    setFormState(prev => {
      const newData = { ...prev.data, [field]: value };
      const fieldError = validateField(field, value);
      const newErrors = { ...prev.errors };

      if (fieldError) {
        newErrors[field as string] = fieldError;
      } else {
        delete newErrors[field as string];
      }

      const allErrors = validateForm();
      const isValid = Object.keys(allErrors).length === 0;
      const isDirty = JSON.stringify(newData) !== JSON.stringify(initialData);

      return {
        ...prev,
        data: newData,
        errors: newErrors,
        isValid,
        isDirty,
      };
    });
  }, [validateField, validateForm, initialData]);

  // Update multiple fields
  const updateFields = useCallback((updates: Partial<T>) => {
    setFormState(prev => {
      const newData = { ...prev.data, ...updates };
      const newErrors = { ...prev.errors };

      // Validate each updated field
      Object.keys(updates).forEach(field => {
        const fieldError = validateField(field as keyof T, updates[field as keyof T]);
        if (fieldError) {
          newErrors[field] = fieldError;
        } else {
          delete newErrors[field];
        }
      });

      const allErrors = validateForm();
      const isValid = Object.keys(allErrors).length === 0;
      const isDirty = JSON.stringify(newData) !== JSON.stringify(initialData);

      return {
        ...prev,
        data: newData,
        errors: newErrors,
        isValid,
        isDirty,
      };
    });
  }, [validateField, validateForm, initialData]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormState({
      data: initialData,
      errors: {},
      isSubmitting: false,
      isValid: false,
      isDirty: false,
    });
  }, [initialData]);

  // Set submitting state
  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setFormState(prev => ({ ...prev, isSubmitting }));
  }, []);

  // Set form data
  const setFormData = useCallback((data: T) => {
    setFormState(prev => {
      const newErrors = validateForm();
      const isValid = Object.keys(newErrors).length === 0;
      const isDirty = JSON.stringify(data) !== JSON.stringify(initialData);

      return {
        ...prev,
        data,
        errors: newErrors,
        isValid,
        isDirty,
      };
    });
  }, [validateForm, initialData]);

  // Get field error
  const getFieldError = useCallback((field: keyof T): string | undefined => {
    return formState.errors[field as string];
  }, [formState.errors]);

  // Check if field has error
  const hasFieldError = useCallback((field: keyof T): boolean => {
    return !!formState.errors[field as string];
  }, [formState.errors]);

  // Check if form is valid
  const isFormValid = useCallback((): boolean => {
    return formState.isValid;
  }, [formState.isValid]);

  // Get form data
  const getFormData = useCallback((): T => {
    return formState.data;
  }, [formState.data]);

  // Get form errors
  const getFormErrors = useCallback((): ValidationErrors => {
    return formState.errors;
  }, [formState.errors]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setFormState(prev => ({ ...prev, errors: {} }));
  }, []);

  // Clear field error
  const clearFieldError = useCallback((field: keyof T) => {
    setFormState(prev => {
      const newErrors = { ...prev.errors };
      delete newErrors[field as string];
      return { ...prev, errors: newErrors };
    });
  }, []);

  return {
    // Form state
    formState,
    data: formState.data,
    errors: formState.errors,
    isSubmitting: formState.isSubmitting,
    isValid: formState.isValid,
    isDirty: formState.isDirty,

    // Actions
    updateField,
    updateFields,
    resetForm,
    setSubmitting,
    setFormData,

    // Validation
    validateField,
    validateForm,
    getFieldError,
    hasFieldError,
    isFormValid,
    getFormData,
    getFormErrors,
    clearErrors,
    clearFieldError,
  };
}
