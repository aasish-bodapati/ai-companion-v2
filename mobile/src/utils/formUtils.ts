/**
 * Common form utilities for React Native components
 * Extracted from various form components to reduce duplication
 */

import { COLORS, SPACING, FONT_SIZE } from '../theme/constants';


// ============================================================================
// FORM VALIDATION UTILITIES
// ============================================================================

/**
 * Common validation patterns
 */
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  url: /^https?:\/\/.+/,
  numeric: /^\d+$/,
  decimal: /^\d*\.?\d+$/,
};

/**
 * Common validation messages
 */
export const validationMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  password: 'Password must be at least 8 characters with uppercase, lowercase, and number',
  username: 'Username must be 3-20 characters (letters, numbers, underscore only)',
  url: 'Please enter a valid URL',
  numeric: 'Please enter a valid number',
  decimal: 'Please enter a valid decimal number',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must be no more than ${max} characters`,
  min: (min: number) => `Must be at least ${min}`,
  max: (max: number) => `Must be no more than ${max}`,
  match: 'Values do not match',
};

/**
 * Validate a single field
 */
export const validateField = (value: string, rules: ValidationRule[]): string | null => {
  for (const rule of rules) {
    const error = rule.validator(value);
    if (error) return error;
  }
  return null;
};

/**
 * Validate entire form
 */
export const validateForm = (data: Record<string, string>, rules: Record<string, ValidationRule[]>): Record<string, string> => {
  const errors: Record<string, string> = {};

  for (const [fieldName, fieldRules] of Object.entries(rules)) {
    const error = validateField(data[fieldName] || '', fieldRules);
    if (error) {
      errors[fieldName] = error;
    }
  }

  return errors;
};

// ============================================================================
// FORM STYLING UTILITIES
// ============================================================================

/**
 * Get input styles based on state
 */
export const getInputStyles = (state: InputState) => {
  const baseStyles = {
    borderColor: COLORS.border.light,
    backgroundColor: COLORS.background.primary,
    color: COLORS.text.primary,
  };

  if (state.focused) {
    return {
      ...baseStyles,
      borderColor: COLORS.primary.main,
      borderWidth: 2,
    };
  }

  if (state.error) {
    return {
      ...baseStyles,
      borderColor: COLORS.danger,
      borderWidth: 2,
    };
  }

  if (state.disabled) {
    return {
      ...baseStyles,
      backgroundColor: COLORS.background.disabled,
      color: COLORS.text.disabled,
    };
  }

  return baseStyles;
};

/**
 * Get label styles based on state
 */
export const getLabelStyles = (state: InputState) => {
  const baseStyles = {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  };

  if (state.focused) {
    return {
      ...baseStyles,
      color: COLORS.primary.main,
    };
  }

  if (state.error) {
    return {
      ...baseStyles,
      color: COLORS.danger,
    };
  }

  return baseStyles;
};

/**
 * Get error message styles
 */
export const getErrorStyles = () => ({
  fontSize: FONT_SIZE.xs,
  color: COLORS.danger,
  marginTop: SPACING.xs,
  marginLeft: SPACING.xs,
});

/**
 * Get helper text styles
 */
export const getHelperStyles = () => ({
  fontSize: FONT_SIZE.xs,
  color: COLORS.text.tertiary,
  marginTop: SPACING.xs,
  marginLeft: SPACING.xs,
});

// ============================================================================
// FORM BEHAVIOR UTILITIES
// ============================================================================

/**
 * Handle input focus
 */
export const handleInputFocus = (
  setState: (state: InputState) => void,
  currentState: InputState
) => {
  setState({
    ...currentState,
    focused: true,
    error: false,
  });
};

/**
 * Handle input blur
 */
export const handleInputBlur = (
  setState: (state: InputState) => void,
  currentState: InputState,
  validate?: (value: string) => string | null
) => {
  const error = validate ? validate(currentState.value) : null;
  setState({
    ...currentState,
    focused: false,
    error: !!error,
  });
  return error;
};

/**
 * Handle input change
 */
export const handleInputChange = (
  value: string,
  setState: (state: InputState) => void,
  currentState: InputState,
  validate?: (value: string) => string | null
) => {
  const error = validate ? validate(value) : null;
  setState({
    ...currentState,
    value,
    error: !!error,
  });
  return error;
};

// ============================================================================
// FORM SUBMISSION UTILITIES
// ============================================================================

/**
 * Prepare form data for submission
 */
export const prepareFormData = (data: Record<string, unknown>): Record<string, unknown> => {
  const prepared: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Convert empty strings to null
    if (value === '') {
      prepared[key] = null;
    }
    // Convert numeric strings to numbers
    else if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
      prepared[key] = Number(value);
    }
    // Keep other values as-is
    else {
      prepared[key] = value;
    }
  }

  return prepared;
};

/**
 * Check if form is valid
 */
export const isFormValid = (errors: Record<string, string>): boolean => {
  return Object.keys(errors).length === 0;
};

/**
 * Get form submission state
 */
export const getFormSubmissionState = (
  isSubmitting: boolean,
  errors: Record<string, string>
) => {
  return {
    isSubmitting,
    isValid: isFormValid(errors),
    hasErrors: !isFormValid(errors),
    canSubmit: !isSubmitting && isFormValid(errors),
  };
};

// ============================================================================
// FORM RESET UTILITIES
// ============================================================================

/**
 * Reset form to initial state
 */
export const resetForm = (
  setData: (data: Record<string, unknown>) => void,
  setErrors: (errors: Record<string, string>) => void,
  setState: (state: FormState) => void,
  initialData: Record<string, unknown> = {}
) => {
  setData(initialData);
  setErrors({});
  setState({
    isSubmitting: false,
    isDirty: false,
    isValid: true,
  });
};

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationRule {
  validator: (value: string) => string | null;
}

export interface InputState {
  value: string;
  focused: boolean;
  error: boolean;
  disabled?: boolean;
}

export interface FormState {
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
}

// ============================================================================
// COMMON VALIDATION RULES
// ============================================================================

export const commonValidationRules = {
  required: (message: string = validationMessages.required): ValidationRule => ({
    validator: (value: string) => value.trim() === '' ? message : null,
  }),

  email: (message: string = validationMessages.email): ValidationRule => ({
    validator: (value: string) =>
      value.trim() === '' || validationPatterns.email.test(value) ? null : message,
  }),

  phone: (message: string = validationMessages.phone): ValidationRule => ({
    validator: (value: string) =>
      value.trim() === '' || validationPatterns.phone.test(value) ? null : message,
  }),

  password: (message: string = validationMessages.password): ValidationRule => ({
    validator: (value: string) =>
      value.trim() === '' || validationPatterns.password.test(value) ? null : message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validator: (value: string) =>
      value.length >= min ? null : (message || validationMessages.minLength(min)),
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validator: (value: string) =>
      value.length <= max ? null : (message || validationMessages.maxLength(max)),
  }),

  numeric: (message: string = validationMessages.numeric): ValidationRule => ({
    validator: (value: string) =>
      value.trim() === '' || validationPatterns.numeric.test(value) ? null : message,
  }),

  decimal: (message: string = validationMessages.decimal): ValidationRule => ({
    validator: (value: string) =>
      value.trim() === '' || validationPatterns.decimal.test(value) ? null : message,
  }),

  min: (min: number, message?: string): ValidationRule => ({
    validator: (value: string) => {
      const num = parseFloat(value);
      return isNaN(num) || num >= min ? null : (message || validationMessages.min(min));
    },
  }),

  max: (max: number, message?: string): ValidationRule => ({
    validator: (value: string) => {
      const num = parseFloat(value);
      return isNaN(num) || num <= max ? null : (message || validationMessages.max(max));
    },
  }),

  match: (otherValue: string, message: string = validationMessages.match): ValidationRule => ({
    validator: (value: string) => value === otherValue ? null : message,
  }),
};
