import { useState, useCallback, useEffect } from 'react';

export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  url?: boolean;
  custom?: (value: any) => string | null;
  message?: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface FormErrors {
  [key: string]: string;
}

export interface UseFormValidationOptions {
  rules: ValidationRules;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

export function useFormValidation({
  rules,
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300
}: UseFormValidationOptions) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [isValidating, setIsValidating] = useState(false);

  const validateField = useCallback((name: string, value: any): string | null => {
    const rule = rules[name];
    if (!rule) return null;

    // Required validation
    if (rule.required && (value === '' || value === null || value === undefined)) {
      return rule.message || `${name} is required`;
    }

    // Skip other validations if value is empty and not required
    if (!rule.required && (value === '' || value === null || value === undefined)) {
      return null;
    }

    // Type-specific validations
    if (typeof value === 'string') {
      // Min length
      if (rule.minLength && value.length < rule.minLength) {
        return rule.message || `${name} must be at least ${rule.minLength} characters`;
      }

      // Max length
      if (rule.maxLength && value.length > rule.maxLength) {
        return rule.message || `${name} must be at most ${rule.maxLength} characters`;
      }

      // Email validation
      if (rule.email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
          return rule.message || `${name} must be a valid email address`;
        }
      }

      // URL validation
      if (rule.url) {
        try {
          new URL(value);
        } catch {
          return rule.message || `${name} must be a valid URL`;
        }
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        return rule.message || `${name} format is invalid`;
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return rule.message || `${name} must be at least ${rule.min}`;
      }

      if (rule.max !== undefined && value > rule.max) {
        return rule.message || `${name} must be at most ${rule.max}`;
      }
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, [rules]);

  const validateForm = useCallback((values: Record<string, any>): FormErrors => {
    const newErrors: FormErrors = {};
    
    Object.keys(rules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    return newErrors;
  }, [rules, validateField]);

  const validateSingleField = useCallback((name: string, value: any) => {
    const error = validateField(name, value);
    
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[name] = error;
      } else {
        delete newErrors[name];
      }
      return newErrors;
    });

    return error;
  }, [validateField]);

  const handleFieldChange = useCallback((name: string, value: any) => {
    if (validateOnChange) {
      // Debounce validation for better performance
      const timeoutId = setTimeout(() => {
        validateSingleField(name, value);
      }, debounceMs);

      return () => clearTimeout(timeoutId);
    }
  }, [validateOnChange, validateSingleField, debounceMs]);

  const handleFieldBlur = useCallback((name: string, value: any) => {
    setTouched(prev => new Set(prev).add(name));
    
    if (validateOnBlur) {
      validateSingleField(name, value);
    }
  }, [validateOnBlur, validateSingleField]);

  const setFieldTouched = useCallback((name: string) => {
    setTouched(prev => new Set(prev).add(name));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((name: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const hasErrors = Object.keys(errors).length > 0;
  const hasFieldError = (name: string) => !!errors[name];
  const getFieldError = (name: string) => errors[name] || null;
  const isFieldTouched = (name: string) => touched.has(name);

  // Auto-validate all fields when rules change
  useEffect(() => {
    if (Object.keys(rules).length > 0) {
      setIsValidating(true);
      // This would typically be called with current form values
      // For now, we'll just set it to false after a brief moment
      setTimeout(() => setIsValidating(false), 100);
    }
  }, [rules]);

  return {
    errors,
    touched,
    isValidating,
    hasErrors,
    hasFieldError,
    getFieldError,
    isFieldTouched,
    validateForm,
    validateSingleField,
    handleFieldChange,
    handleFieldBlur,
    setFieldTouched,
    clearErrors,
    clearFieldError
  };
}
