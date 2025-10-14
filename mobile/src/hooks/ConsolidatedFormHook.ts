/**
 * Consolidated Form Hook
 * 
 * Combines:
 * - useFormState (form state management)
 * - useFormValidation (form validation)
 * - useUnifiedForm (unified form handling)
 * - useModalState (modal state management)
 * - useLoggingModal (logging modal state)
 * - useSearch (search functionality)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { DebugUtils } from '../utils/debugUtils';

// ===== TYPES =====

export interface FormField<T = any> {
  value: T;
  error: string | null;
  touched: boolean;
  dirty: boolean;
}

export interface FormState<T extends Record<string, any>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  dirty: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

export interface ValidationRule<T = any> {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
  message?: string;
}

export interface FormOptions<T extends Record<string, any>> {
  initialValues: T;
  validationRules?: Partial<Record<keyof T, ValidationRule>>;
  onSubmit: (values: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  resetOnSubmit?: boolean;
}

export interface ModalState {
  isVisible: boolean;
  data: Record<string, unknown> | null;
  type: string | null;
}

export interface SearchState<T = unknown> {
  query: string;
  results: T[];
  loading: boolean;
  error: string | null;
  filters: Record<string, unknown>;
  sortBy: string | null;
  sortOrder: 'asc' | 'desc';
}

// ===== CONSOLIDATED FORM HOOK =====

export function useForm<T extends Record<string, unknown>>(
  options: FormOptions<T>
): FormState<T> & {
  setValue: (field: keyof T, value: T[keyof T]) => void;
  setError: (field: keyof T, error: string | null) => void;
  setTouched: (field: keyof T, touched: boolean) => void;
  handleChange: (field: keyof T) => (value: T[keyof T]) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: () => Promise<void>;
  reset: () => void;
  validate: () => boolean;
  validateField: (field: keyof T) => string | null;
} {
  const {
    initialValues,
    validationRules = {},
    onSubmit,
    validateOnChange = true,
    validateOnBlur = true,
    resetOnSubmit = false
  } = options;

  const [state, setState] = useState<FormState<T>>({
    values: { ...initialValues },
    errors: {},
    touched: {},
    dirty: {},
    isValid: false,
    isSubmitting: false,
    isDirty: false
  });

  // Validation function
  const validateField = useCallback((field: keyof T): string | null => {
    const value = state.values[field];
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

    // Min/Max validation for numbers
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return rules.message || `${String(field)} must be at least ${rules.min}`;
      }
      if (rules.max !== undefined && value > rules.max) {
        return rules.message || `${String(field)} must be at most ${rules.max}`;
      }
    }

    // MinLength/MaxLength validation for strings
    if (typeof value === 'string') {
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        return rules.message || `${String(field)} must be at least ${rules.minLength} characters`;
      }
      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        return rules.message || `${String(field)} must be at most ${rules.maxLength} characters`;
      }
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
  }, [state.values, validationRules]);

  // Validate all fields
  const validate = useCallback((): boolean => {
    const errors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validationRules).forEach((field) => {
      const error = validateField(field as keyof T);
      if (error) {
        errors[field as keyof T] = error;
        isValid = false;
      }
    });

    setState(prev => ({
      ...prev,
      errors,
      isValid
    }));

    return isValid;
  }, [validateField, validationRules]);

  // Set value
  const setValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setState(prev => {
      const newValues = { ...prev.values, [field]: value };
      const newDirty = { ...prev.dirty, [field]: true };
      const isDirty = Object.values(newDirty).some(Boolean);

      return {
        ...prev,
        values: newValues,
        dirty: newDirty,
        isDirty
      };
    });

    // Validate on change if enabled
    if (validateOnChange) {
      const error = validateField(field);
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, [field]: error }
      }));
    }
  }, [validateField, validateOnChange]);

  // Set error
  const setError = useCallback((field: keyof T, error: string | null) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: error }
    }));
  }, []);

  // Set touched
  const setTouched = useCallback((field: keyof T, touched: boolean) => {
    setState(prev => ({
      ...prev,
      touched: { ...prev.touched, [field]: touched }
    }));
  }, []);

  // Handle change
  const handleChange = useCallback((field: keyof T) => (value: T[keyof T]) => {
    setValue(field, value);
  }, [setValue]);

  // Handle blur
  const handleBlur = useCallback((field: keyof T) => () => {
    setTouched(field, true);
    
    if (validateOnBlur) {
      const error = validateField(field);
      setError(field, error);
    }
  }, [setTouched, validateOnBlur, validateField, setError]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    setState(prev => ({ ...prev, isSubmitting: true }));

    try {
      // Validate form
      const isValid = validate();
      if (!isValid) {
        setState(prev => ({ ...prev, isSubmitting: false }));
        return;
      }

      // Submit form
      await onSubmit(state.values);

      // Reset form if enabled
      if (resetOnSubmit) {
        reset();
      }
    } catch (error) {
      DebugUtils.error('Form submission error:', error);
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [state.values, validate, onSubmit, resetOnSubmit]);

  // Reset form
  const reset = useCallback(() => {
    setState({
      values: { ...initialValues },
      errors: {},
      touched: {},
      dirty: {},
      isValid: false,
      isSubmitting: false,
      isDirty: false
    });
  }, [initialValues]);

  // Validate on mount
  useEffect(() => {
    validate();
  }, [validate]);

  return {
    ...state,
    setValue,
    setError,
    setTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    validate,
    validateField
  };
}

// ===== MODAL HOOK =====

export function useModal(): ModalState & {
  show: (type: string, data?: any) => void;
  hide: () => void;
  updateData: (data: any) => void;
} {
  const [state, setState] = useState<ModalState>({
    isVisible: false,
    data: null,
    type: null
  });

  const show = useCallback((type: string, data: Record<string, unknown> | null = null) => {
    setState({
      isVisible: true,
      type,
      data
    });
  }, []);

  const hide = useCallback(() => {
    setState({
      isVisible: false,
      data: null,
      type: null
    });
  }, []);

  const updateData = useCallback((data: Record<string, unknown>) => {
    setState(prev => ({
      ...prev,
      data
    }));
  }, []);

  return {
    ...state,
    show,
    hide,
    updateData
  };
}

// ===== SEARCH HOOK =====

export function useSearch<T>(
  searchFn: (query: string, filters: Record<string, unknown>) => Promise<T[]>,
  options: {
    debounceMs?: number;
    minQueryLength?: number;
    initialFilters?: Record<string, unknown>;
  } = {}
): SearchState<T> & {
  search: (query: string) => void;
  setFilters: (filters: Record<string, unknown>) => void;
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  clear: () => void;
} {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    initialFilters = {}
  } = options;

  const [state, setState] = useState<SearchState<T>>({
    query: '',
    results: [],
    loading: false,
    error: null,
    filters: initialFilters,
    sortBy: null,
    sortOrder: 'asc'
  });

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Skip search if query is too short
    if (query.length < minQueryLength) {
      setState(prev => ({ ...prev, results: [], loading: false }));
      return;
    }

    // Debounce search
    debounceRef.current = setTimeout(async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const results = await searchFn(query, state.filters);
        setState(prev => ({
          ...prev,
          results,
          loading: false
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Search failed';
        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false
        }));
      }
    }, debounceMs);
  }, [searchFn, state.filters, minQueryLength, debounceMs]);

  const setFilters = useCallback((filters: Record<string, unknown>) => {
    setState(prev => ({ ...prev, filters }));
    // Re-search with new filters
    if (state.query.length >= minQueryLength) {
      search(state.query);
    }
  }, [state.query, minQueryLength, search]);

  const setSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setState(prev => ({ ...prev, sortBy, sortOrder }));
  }, []);

  const clear = useCallback(() => {
    setState(prev => ({
      ...prev,
      query: '',
      results: [],
      loading: false,
      error: null
    }));
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    ...state,
    search,
    setFilters,
    setSort,
    clear
  };
}

// ===== SPECIALIZED FORM HOOKS =====

export function useLoggingModal() {
  return useModal();
}

export function useSimpleForm<T extends Record<string, unknown>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void> | void
) {
  return useForm({
    initialValues,
    onSubmit,
    validateOnChange: false,
    validateOnBlur: true,
    resetOnSubmit: true
  });
}

export function useRealtimeForm<T extends Record<string, unknown>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void> | void,
  validationRules?: Partial<Record<keyof T, ValidationRule>>
) {
  return useForm({
    initialValues,
    onSubmit,
    validationRules,
    validateOnChange: true,
    validateOnBlur: true,
    resetOnSubmit: false
  });
}
