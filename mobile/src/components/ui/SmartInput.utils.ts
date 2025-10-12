// Utility functions for SmartInput component

export const inputFormatters = {
  // Format numeric input with decimal places
  decimal: (value: string, decimals: number = 2) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toFixed(decimals);
  },

  // Format currency input
  currency: (value: string, currency: string = '$') => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return `${currency}${num.toFixed(2)}`;
  },

  // Format percentage input
  percentage: (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return `${num}%`;
  },

  // Format phone number
  phone: (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return cleaned;
  },

  // Format time (HH:MM)
  time: (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  },
};

export const inputParsers = {
  // Parse numeric input (remove non-numeric characters)
  numeric: (value: string) => {
    return value.replace(/[^0-9.]/g, '');
  },

  // Parse integer input (remove non-integer characters)
  integer: (value: string) => {
    return value.replace(/[^0-9]/g, '');
  },

  // Parse phone number (remove non-digit characters)
  phone: (value: string) => {
    return value.replace(/\D/g, '');
  },

  // Parse currency (remove currency symbols)
  currency: (value: string) => {
    return value.replace(/[^0-9.]/g, '');
  },
};

export const inputValidators = {
  // Validate email
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  // Validate required field
  required: (value: string) => {
    return value.trim().length > 0;
  },

  // Validate minimum length
  minLength: (min: number) => (value: string) => {
    return value.length >= min;
  },

  // Validate maximum length
  maxLength: (max: number) => (value: string) => {
    return value.length <= max;
  },

  // Validate numeric range
  numericRange: (min: number, max: number) => (value: string) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
  },

  // Validate positive number
  positive: (value: string) => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  },

  // Validate non-negative number
  nonNegative: (value: string) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
  },

  // Validate integer
  integer: (value: string) => {
    return /^\d+$/.test(value);
  },

  // Validate decimal places
  decimalPlaces: (places: number) => (value: string) => {
    const decimalIndex = value.indexOf('.');
    if (decimalIndex === -1) return true;
    return value.length - decimalIndex - 1 <= places;
  },
};

// Pre-configured input types for common use cases
export const inputPresets = {
  // Exercise sets input
  sets: {
    type: 'numeric' as const,
    placeholder: '0',
    validation: inputValidators.positive,
    parse: inputParsers.integer,
  },

  // Exercise reps input
  reps: {
    type: 'text' as const,
    placeholder: '8-12',
    validation: inputValidators.required,
  },

  // Weight input
  weight: {
    type: 'numeric' as const,
    placeholder: '0',
    validation: inputValidators.nonNegative,
    parse: inputParsers.numeric,
    format: (value: string) => inputFormatters.decimal(value, 1),
  },

  // Duration input (minutes)
  duration: {
    type: 'numeric' as const,
    placeholder: '0',
    validation: inputValidators.positive,
    parse: inputParsers.numeric,
  },

  // Distance input
  distance: {
    type: 'numeric' as const,
    placeholder: '0',
    validation: inputValidators.nonNegative,
    parse: inputParsers.numeric,
    format: (value: string) => inputFormatters.decimal(value, 2),
  },

  // Search input
  search: {
    type: 'search' as const,
    placeholder: 'Search...',
    showClearButton: true,
    icon: 'search' as const,
  },

  // Email input
  email: {
    type: 'email' as const,
    placeholder: 'Enter email',
    validation: inputValidators.email,
  },

  // Password input
  password: {
    type: 'password' as const,
    placeholder: 'Enter password',
    validation: inputValidators.minLength(6),
  },
};
