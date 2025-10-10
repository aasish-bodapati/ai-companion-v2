/**
 * Utility functions index
 * Centralized exports for all utility functions
 */

// Core utilities
export * from './logger';
export * from './haptics';
export * from './performance';
export * from './networkUtils';
export * from './toast';

// New consolidated utilities
export * from './componentUtils';
export * from './loggingUtils';
export * from './formUtils';

// Form validation - export specific items to avoid conflicts
export { FormValidator } from './formValidation';
export type { ValidationRule as FormValidationRule } from './formValidation';
