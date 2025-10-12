
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  email?: boolean;
  custom?: (value: unknown) => string | undefined;
  message?: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

export class FormValidator {
  private rules: ValidationRules;

  constructor(rules: ValidationRules) {
    this.rules = rules;
  }

  validateField(fieldName: string, value: string): string | undefined {
    const rule = this.rules[fieldName];
    if (!rule) return undefined;

    // Required validation
    if (rule.required && (!value || value.trim().length === 0)) {
      return rule.message || `${fieldName} is required`;
    }

    // Skip other validations if value is empty and not required
    if (!value || value.trim().length === 0) {
      return undefined;
    }

    // Min length validation
    if (rule.minLength && value.length < rule.minLength) {
      return rule.message || `${fieldName} must be at least ${rule.minLength} characters`;
    }

    // Max length validation
    if (rule.maxLength && value.length > rule.maxLength) {
      return rule.message || `${fieldName} must be no more than ${rule.maxLength} characters`;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message || `${fieldName} format is invalid`;
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return undefined;
  }

  validateForm(data: Record<string, unknown>): ValidationErrors {
    const errors: ValidationErrors = {};

    Object.keys(this.rules).forEach(fieldName => {
      const error = this.validateField(fieldName, data[fieldName] || '');
      if (error) {
        errors[fieldName] = error;
      }
    });

    return errors;
  }

  hasErrors(errors: ValidationErrors): boolean {
    return Object.keys(errors).length > 0;
  }

  getFirstError(errors: ValidationErrors): string | undefined {
    const firstKey = Object.keys(errors)[0];
    return firstKey ? errors[firstKey] : undefined;
  }
}

// Common validation patterns
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  numeric: /^\d+$/,
  decimal: /^\d+(\.\d+)?$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  name: /^[a-zA-Z\s]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
};

// Common validation rules
export const CommonRules = {
  required: (message?: string): ValidationRule => ({
    required: true,
    message: message || 'This field is required',
  }),

  email: (message?: string): ValidationRule => ({
    required: true,
    pattern: ValidationPatterns.email,
    message: message || 'Please enter a valid email address',
  }),

  password: (message?: string): ValidationRule => ({
    required: true,
    minLength: 8,
    pattern: ValidationPatterns.password,
    message: message || 'Password must be at least 8 characters with uppercase, lowercase, and number',
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    minLength: min,
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    maxLength: max,
    message: message || `Must be no more than ${max} characters`,
  }),

  numeric: (message?: string): ValidationRule => ({
    pattern: ValidationPatterns.numeric,
    message: message || 'Must be a number',
  }),

  decimal: (message?: string): ValidationRule => ({
    pattern: ValidationPatterns.decimal,
    message: message || 'Must be a valid number',
  }),

  name: (message?: string): ValidationRule => ({
    pattern: ValidationPatterns.name,
    message: message || 'Name can only contain letters and spaces',
  }),

  phone: (message?: string): ValidationRule => ({
    pattern: ValidationPatterns.phone,
    message: message || 'Please enter a valid phone number',
  }),

  age: (message?: string): ValidationRule => ({
    required: true,
    pattern: ValidationPatterns.numeric,
    custom: (value: string) => {
      const age = parseInt(value);
      if (age < 13 || age > 120) {
        return message || 'Age must be between 13 and 120';
      }
      return undefined;
    },
  }),

  height: (message?: string): ValidationRule => ({
    required: true,
    pattern: ValidationPatterns.decimal,
    custom: (value: string) => {
      const height = parseFloat(value);
      if (height < 100 || height > 250) {
        return message || 'Height must be between 100 and 250 cm';
      }
      return undefined;
    },
  }),

  weight: (message?: string): ValidationRule => ({
    required: true,
    pattern: ValidationPatterns.decimal,
    custom: (value: string) => {
      const weight = parseFloat(value);
      if (weight < 20 || weight > 300) {
        return message || 'Weight must be between 20 and 300 kg';
      }
      return undefined;
    },
  }),
};

// Health data validation rules
export const HealthDataRules: ValidationRules = {
  age: CommonRules.age(),
  height: CommonRules.height(),
  weight: CommonRules.weight(),
  gender: CommonRules.required('Please select a gender'),
  activityLevel: CommonRules.required('Please select an activity level'),
};

// User profile validation rules
export const UserProfileRules: ValidationRules = {
  full_name: {
    ...CommonRules.required('Full name is required'),
    ...CommonRules.name(),
    ...CommonRules.minLength(2, 'Name must be at least 2 characters'),
  },
  email: CommonRules.email(),
  phone: CommonRules.phone(),
};

// Login form validation rules
export const LoginRules: ValidationRules = {
  email: CommonRules.email(),
  password: CommonRules.required('Password is required'),
};

// Registration form validation rules
export const RegistrationRules: ValidationRules = {
  full_name: {
    ...CommonRules.required('Full name is required'),
    ...CommonRules.name(),
    ...CommonRules.minLength(2, 'Name must be at least 2 characters'),
  },
  email: CommonRules.email(),
  password: CommonRules.password(),
  confirmPassword: {
    required: true,
    custom: (value: string, formData?: Record<string, string>) => {
      if (formData && value !== formData.password) {
        return 'Passwords do not match';
      }
      return undefined;
    },
  },
};
