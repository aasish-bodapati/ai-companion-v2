import { useState, useCallback, useEffect } from 'react';


import { DebugUtils } from '../utils/debugUtils';

export type ValidationRule<T = any> = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
  message?: string;
};

export type FormField<T = any> = {
  value: T;
  error: string | null;
  touched: boolean;
  dirty: boolean;
};

export type FormState<T extends Record<string, any>> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  dirty: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
};

export type FormConfig<T extends Record<string, any>> = {
  initialValues: T;
  validationRules?: Partial<Record<keyof T, ValidationRule>>;
  onSubmit: (values: T) => Promise<void> | void;
  onReset?: () => void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnSubmit?: boolean;
};

export type FormActions<T extends Record<string, any>> = {
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setError: <K extends keyof T>(field: K, error: string | null) => void;
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  setTouched: <K extends keyof T>(field: K, touched: boolean) => void;
  setTouchedAll: (touched: boolean) => void;
  setDirty: <K extends keyof T>(field: K, dirty: boolean) => void;
  setDirtyAll: (dirty: boolean) => void;
  reset: () => void;
  submit: () => Promise<void>;
  validate: () => boolean;
  validateField: <K extends keyof T>(field: K) => string | null;
  getFieldProps: <K extends keyof T>(field: K) => {
    value: T[K];
    error: string | null;
    touched: boolean;
    dirty: boolean;
    onChange: (value: T[K]) => void;
    onBlur: () => void;
    onFocus: () => void;
  };
};

export function useUnifiedForm<T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit,
  onReset,
  validateOnChange = true,
  validateOnBlur = true,
  validateOnSubmit = true,
}: FormConfig<T>): FormState<T> & FormActions<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [dirty, setDirty] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Validation function
  const validateField = useCallback(<K extends keyof T>(field: K): string | null => {
    const value = values[field];
    const rules = validationRules[field];

    if (!rules) return null;

    // Required validation
    if (rules.required && (value === undefined || value === null || value === '')) {
      return rules.message || `${String(field)} is required`;
    }

    // Skip other validations if value is empty and not required
    if (!rules.required && (value === undefined || value === null || value === '')) {
      return null;
    }

    // Min length validation
    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
      return rules.message || `${String(field)} must be at least ${rules.minLength} characters`;
    }

    // Max length validation
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      return rules.message || `${String(field)} must be no more than ${rules.maxLength} characters`;
    }

    // Min value validation
    if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
      return rules.message || `${String(field)} must be at least ${rules.min}`;
    }

    // Max value validation
    if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
      return rules.message || `${String(field)} must be no more than ${rules.max}`;
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      return rules.message || `${String(field)} format is invalid`;
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  }, [values, validationRules]);

  // Validate all fields
  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validationRules).forEach((field) => {
      const error = validateField(field as keyof T);
      if (error) {
        newErrors[field as keyof T] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validateField, validationRules]);

  // Set value for a field
  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setDirty(field, true);

    if (validateOnChange) {
      const error = validateField(field);
      setError(field, error);
    }
  }, [validateOnChange, validateField]);

  // Set multiple values
  const setValuesAction = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));

    // Mark all changed fields as dirty
    Object.keys(newValues).forEach((field) => {
      setDirty(field as keyof T, true);
    });

    if (validateOnChange) {
      const newErrors: Partial<Record<keyof T, string>> = {};
      let hasErrors = false;

      Object.keys(newValues).forEach((field) => {
        const error = validateField(field as keyof T);
        if (error) {
          newErrors[field as keyof T] = error;
          hasErrors = true;
        }
      });

      setErrors(prev => ({ ...prev, ...newErrors }));
    }
  }, [validateOnChange, validateField]);

  // Set error for a field
  const setError = useCallback(<K extends keyof T>(field: K, error: string | null) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  // Set multiple errors
  const setErrorsAction = useCallback((newErrors: Partial<Record<keyof T, string>>) => {
    setErrors(prev => ({ ...prev, ...newErrors }));
  }, []);

  // Set touched for a field
  const setTouched = useCallback(<K extends keyof T>(field: K, touchedValue: boolean) => {
    setTouched(prev => ({ ...prev, [field]: touchedValue }));
  }, []);

  // Set touched for all fields
  const setTouchedAll = useCallback((touchedValue: boolean) => {
    const newTouched: Partial<Record<keyof T, boolean>> = {};
    Object.keys(initialValues).forEach((field) => {
      newTouched[field as keyof T] = touchedValue;
    });
    setTouched(newTouched);
  }, [initialValues]);

  // Set dirty for a field
  const setDirty = useCallback(<K extends keyof T>(field: K, dirtyValue: boolean) => {
    setDirty(prev => ({ ...prev, [field]: dirtyValue }));
  }, []);

  // Set dirty for all fields
  const setDirtyAll = useCallback((dirtyValue: boolean) => {
    const newDirty: Partial<Record<keyof T, boolean>> = {};
    Object.keys(initialValues).forEach((field) => {
      newDirty[field as keyof T] = dirtyValue;
    });
    setDirty(newDirty);
  }, [initialValues]);

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setDirty({});
    setIsSubmitting(false);
    setIsSubmitted(false);
    onReset?.();
  }, [initialValues, onReset]);

  // Submit form
  const submit = useCallback(async () => {
    setIsSubmitting(true);
    setIsSubmitted(true);

    try {
      if (validateOnSubmit && !validate()) {
        return;
      }

      await onSubmit(values);
    } catch (error) {
      DebugUtils.error('Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, onSubmit, validateOnSubmit, validate]);

  // Get field props for easy use in components
  const getFieldProps = useCallback(<K extends keyof T>(field: K) => {
    return {
      value: values[field],
      error: errors[field] || null,
      touched: touched[field] || false,
      dirty: dirty[field] || false,
      onChange: (value: T[K]) => setValue(field, value),
      onBlur: () => {
        setTouched(field, true);
        if (validateOnBlur) {
          const error = validateField(field);
          setError(field, error);
        }
      },
      onFocus: () => {
        // Focus handler if needed
      },
    };
  }, [values, errors, touched, dirty, setValue, setTouched, validateOnBlur, validateField, setError]);

  // Computed values
  const isValid = Object.keys(errors).length === 0;
  const isDirty = Object.values(dirty).some(Boolean);

  return {
    // State
    values,
    errors,
    touched,
    dirty,
    isValid,
    isDirty,
    isSubmitting,
    isSubmitted,

    // Actions
    setValue,
    setValues: setValuesAction,
    setError,
    setErrors: setErrorsAction,
    setTouched,
    setTouchedAll,
    setDirty,
    setDirtyAll,
    reset,
    submit,
    validate,
    validateField,
    getFieldProps,
  };
}

// Specialized form hooks for common patterns
export function useSimpleForm<T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void> | void
) {
  return useUnifiedForm({
    initialValues,
    onSubmit,
    validateOnChange: false,
    validateOnBlur: true,
    validateOnSubmit: true,
  });
}

export function useRealtimeForm<T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void> | void,
  validationRules?: Partial<Record<keyof T, ValidationRule>>
) {
  return useUnifiedForm({
    initialValues,
    onSubmit,
    validationRules,
    validateOnChange: true,
    validateOnBlur: true,
    validateOnSubmit: true,
  });
}

export function useModalForm<T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void> | void,
  onReset?: () => void
) {
  return useUnifiedForm({
    initialValues,
    onSubmit,
    onReset,
    validateOnChange: false,
    validateOnBlur: true,
    validateOnSubmit: true,
  });
}
