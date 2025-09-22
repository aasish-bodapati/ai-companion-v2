export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateField(value: any, rules: ValidationRule): string | null {
  // Required validation
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return 'This field is required';
  }

  // Skip other validations if value is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }

  // Min/Max validation for numbers
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      return `Value must be at least ${rules.min}`;
    }
    if (rules.max !== undefined && value > rules.max) {
      return `Value must be at most ${rules.max}`;
    }
  }

  // Min/Max length validation for strings
  if (typeof value === 'string') {
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters`;
    }
    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      return `Must be at most ${rules.maxLength} characters`;
    }
  }

  // Pattern validation
  if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
    return 'Invalid format';
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
}

export function validateForm(values: Record<string, any>, schema: ValidationSchema): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [fieldName, rules] of Object.entries(schema)) {
    const error = validateField(values[fieldName], rules);
    if (error) {
      errors[fieldName] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Common validation rules
export const commonRules = {
  required: { required: true },
  email: { 
    required: true, 
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (!value) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address';
      }
      return null;
    }
  },
  password: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be at least 8 characters';
      if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
      if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
      if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
      return null;
    }
  },
  phone: {
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    custom: (value: string) => {
      if (!value) return null; // Optional field
      if (!/^[\+]?[1-9][\d]{0,15}$/.test(value)) {
        return 'Please enter a valid phone number';
      }
      return null;
    }
  },
  url: {
    pattern: /^https?:\/\/.+/,
    custom: (value: string) => {
      if (!value) return null; // Optional field
      if (!/^https?:\/\/.+/.test(value)) {
        return 'Please enter a valid URL (starting with http:// or https://)';
      }
      return null;
    }
  }
};
