import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface AppError {
  id: string;
  message: string;
  type: 'network' | 'validation' | 'permission' | 'unknown';
  timestamp: Date;
  context?: string;
  retryable?: boolean;
  retryAction?: () => Promise<void>;
}

interface ErrorContextType {
  errors: AppError[];
  addError: (error: Omit<AppError, 'id' | 'timestamp'>) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  clearErrorsByType: (type: AppError['type']) => void;
  retryError: (id: string) => Promise<void>;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [errors, setErrors] = useState<AppError[]>([]);

  const addError = useCallback((errorData: Omit<AppError, 'id' | 'timestamp'>) => {
    const error: AppError = {
      ...errorData,
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    setErrors(prev => {
      // Avoid duplicate errors with same message and context
      const isDuplicate = prev.some(
        existingError =>
          existingError.message === error.message &&
          existingError.context === error.context &&
          existingError.type === error.type
      );

      if (isDuplicate) {
        return prev;
      }

      return [...prev, error];
    });
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearErrorsByType = useCallback((type: AppError['type']) => {
    setErrors(prev => prev.filter(error => error.type !== type));
  }, []);

  const retryError = useCallback(async (id: string) => {
    const error = errors.find(e => e.id === id);
    if (error && error.retryable && error.retryAction) {
      try {
        await error.retryAction();
        removeError(id);
      } catch (retryError) {
        // Update error message with retry failure
        setErrors(prev =>
          prev.map(e =>
            e.id === id
              ? { ...e, message: `${e.message} (Retry failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'})` }
              : e
          )
        );
      }
    }
  }, [errors, removeError]);

  const value: ErrorContextType = {
    errors,
    addError,
    removeError,
    clearErrors,
    clearErrorsByType,
    retryError,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useErrorContext() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
}

// Convenience hooks for specific error types
export function useNetworkError() {
  const { addError, errors, removeError } = useErrorContext();

  const addNetworkError = useCallback((message: string, context?: string, retryAction?: () => Promise<void>) => {
    addError({
      message,
      type: 'network',
      context,
      retryable: !!retryAction,
      retryAction,
    });
  }, [addError]);

  const networkErrors = errors.filter(error => error.type === 'network');

  return {
    addNetworkError,
    networkErrors,
    removeNetworkError: removeError,
  };
}

export function useValidationError() {
  const { addError, errors, removeError } = useErrorContext();

  const addValidationError = useCallback((message: string, context?: string) => {
    addError({
      message,
      type: 'validation',
      context,
      retryable: false,
    });
  }, [addError]);

  const validationErrors = errors.filter(error => error.type === 'validation');

  return {
    addValidationError,
    validationErrors,
    removeValidationError: removeError,
  };
}

export function usePermissionError() {
  const { addError, errors, removeError } = useErrorContext();

  const addPermissionError = useCallback((message: string, context?: string) => {
    addError({
      message,
      type: 'permission',
      context,
      retryable: false,
    });
  }, [addError]);

  const permissionErrors = errors.filter(error => error.type === 'permission');

  return {
    addPermissionError,
    permissionErrors,
    removePermissionError: removeError,
  };
}
