import { useState, useCallback } from 'react';
import { ValidationErrors, ValidationRules, FormValidator } from '../utils/formValidation';

/**
 * Hook for managing form data and validation
 * Integrates with the existing formValidation utility
 */
export const useFormState = <T extends Record<string, any>>(
  initialData: T, 
  rules?: ValidationRules
) => {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  
  const validator = rules ? new FormValidator(rules) : null;

  const updateField = useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    setErrors(prev => {
      if (prev[field as string]) {
        return { ...prev, [field]: '' };
      }
      return prev;
    });
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []); // Remove errors dependency to prevent infinite loops

  const updateFields = useCallback((updates: Partial<T>) => {
    setData(prev => ({ ...prev, ...updates }));
    
    // Clear errors for updated fields
    const fieldNames = Object.keys(updates) as (keyof T)[];
    setErrors(prev => {
      const newErrors = { ...prev };
      fieldNames.forEach(field => {
        if (newErrors[field as string]) {
          delete newErrors[field as string];
        }
      });
      return newErrors;
    });
    
    // Mark fields as touched
    setTouched(prev => {
      const newTouched = { ...prev };
      fieldNames.forEach(field => {
        newTouched[field] = true;
      });
      return newTouched;
    });
  }, []); // Remove errors and touched dependencies to prevent infinite loops

  const validateField = useCallback((field: keyof T): boolean => {
    if (!validator) return true;
    
    const fieldRules = rules?.[field as string];
    if (!fieldRules) return true;
    
    const fieldValidator = new FormValidator({ [field as string]: fieldRules });
    const fieldErrors = fieldValidator.validateField(field as string, data[field]);
    
    setErrors(prev => ({ ...prev, ...(fieldErrors || {}) as Record<string, string> }));
    return !fieldValidator.hasErrors((fieldErrors || {}) as any);
  }, [data, validator, rules]);

  const validateForm = useCallback((): boolean => {
    if (!validator) return true;
    
    const newErrors = validator.validateForm(data);
    setErrors(newErrors);
    return !validator.hasErrors(newErrors);
  }, [data, validator]);

  const resetForm = useCallback(() => {
    setData(initialData);
    setErrors({});
    setTouched({} as Record<keyof T, boolean>);
  }, [initialData]);

  const resetErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const hasErrors = useCallback((): boolean => {
    return Object.values(errors).some(error => error !== '');
  }, [errors]);

  const isFieldTouched = useCallback((field: keyof T): boolean => {
    return touched[field] || false;
  }, [touched]);

  const isFormValid = useCallback((): boolean => {
    return !hasErrors() && (validator ? validateForm() : true);
  }, [hasErrors, validateForm, validator]);

  return {
    data,
    errors,
    touched,
    updateField,
    updateFields,
    validateField,
    validateForm,
    resetForm,
    resetErrors,
    setFieldError,
    hasErrors,
    isFieldTouched,
    isFormValid,
  };
};

export default useFormState;
