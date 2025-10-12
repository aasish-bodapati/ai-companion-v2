/**
 * Tests for the error handling system
 * Tests ErrorContext, ErrorBoundary, and error handling hooks
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ErrorProvider, useErrorContext, useNetworkError, useValidationError, usePermissionError } from '../contexts/ErrorContext';
import ErrorBoundary from '../components/ErrorBoundary';
import ErrorDisplay from '../components/ErrorDisplay';
import { useErrorHandler, useApiErrorHandler } from '../hooks/useErrorHandler';

// Test component that uses error context
const TestErrorComponent = () => {
  const { addError, errors, removeError, clearErrors } = useErrorContext();
  
  return (
    <div>
      <button 
        data-testid="add-error" 
        onClick={() => addError({ message: 'Test error', type: 'unknown' })}
      >
        Add Error
      </button>
      <button 
        data-testid="remove-error" 
        onClick={() => removeError(errors[0]?.id || '')}
      >
        Remove Error
      </button>
      <button 
        data-testid="clear-errors" 
        onClick={clearErrors}
      >
        Clear Errors
      </button>
      <div data-testid="error-count">{errors.length}</div>
      {errors.map(error => (
        <div key={error.id} data-testid={`error-${error.id}`}>
          {error.message}
        </div>
      ))}
    </div>
  );
};

// Test component that throws an error
const ErrorThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Test component that uses error handler hook
const TestErrorHandlerComponent = () => {
  const { handleError, handleNetworkError, handleValidationError, handlePermissionError } = useErrorHandler({ context: 'TestComponent' });
  
  return (
    <div>
      <button 
        data-testid="handle-error" 
        onClick={() => handleError('Test error', 'unknown')}
      >
        Handle Error
      </button>
      <button 
        data-testid="handle-network-error" 
        onClick={() => handleNetworkError('Network error')}
      >
        Handle Network Error
      </button>
      <button 
        data-testid="handle-validation-error" 
        onClick={() => handleValidationError('Validation error')}
      >
        Handle Validation Error
      </button>
      <button 
        data-testid="handle-permission-error" 
        onClick={() => handlePermissionError('Permission error')}
      >
        Handle Permission Error
      </button>
    </div>
  );
};

// Test component that uses API error handler hook
const TestApiErrorHandlerComponent = () => {
  const { handleApiError, withApiErrorHandling } = useApiErrorHandler('TestAPI');
  
  const handleApiCall = async () => {
    await withApiErrorHandling(async () => {
      throw new Error('API Error');
    });
  };
  
  return (
    <div>
      <button 
        data-testid="handle-api-error" 
        onClick={() => handleApiError(new Error('API Error'))}
      >
        Handle API Error
      </button>
      <button 
        data-testid="handle-api-call" 
        onClick={handleApiCall}
      >
        Handle API Call
      </button>
    </div>
  );
};

describe('ErrorContext', () => {
  it('should provide error context to children', () => {
    render(
      <ErrorProvider>
        <TestErrorComponent />
      </ErrorProvider>
    );
    
    expect(screen.getByTestId('error-count')).toHaveTextContent('0');
  });

  it('should add errors correctly', () => {
    render(
      <ErrorProvider>
        <TestErrorComponent />
      </ErrorProvider>
    );
    
    fireEvent.press(screen.getByTestId('add-error'));
    
    expect(screen.getByTestId('error-count')).toHaveTextContent('1');
    expect(screen.getByText('Test error')).toBeTruthy();
  });

  it('should remove errors correctly', () => {
    render(
      <ErrorProvider>
        <TestErrorComponent />
      </ErrorProvider>
    );
    
    fireEvent.press(screen.getByTestId('add-error'));
    fireEvent.press(screen.getByTestId('remove-error'));
    
    expect(screen.getByTestId('error-count')).toHaveTextContent('0');
  });

  it('should clear all errors correctly', () => {
    render(
      <ErrorProvider>
        <TestErrorComponent />
      </ErrorProvider>
    );
    
    fireEvent.press(screen.getByTestId('add-error'));
    fireEvent.press(screen.getByTestId('add-error'));
    fireEvent.press(screen.getByTestId('clear-errors'));
    
    expect(screen.getByTestId('error-count')).toHaveTextContent('0');
  });

  it('should prevent duplicate errors', () => {
    render(
      <ErrorProvider>
        <TestErrorComponent />
      </ErrorProvider>
    );
    
    fireEvent.press(screen.getByTestId('add-error'));
    fireEvent.press(screen.getByTestId('add-error'));
    
    expect(screen.getByTestId('error-count')).toHaveTextContent('1');
  });
});

describe('ErrorBoundary', () => {
  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('No error')).toBeTruthy();
  });

  it('should render error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Test error')).toBeTruthy();
  });

  it('should allow retry when there is an error', () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    
    fireEvent.press(screen.getByText('Try Again'));
    
    expect(screen.getByText('No error')).toBeTruthy();
  });

  it('should call onError callback when provided', () => {
    const onError = jest.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object)
    );
  });
});

describe('ErrorDisplay', () => {
  it('should not render when there are no errors', () => {
    render(
      <ErrorProvider>
        <ErrorDisplay />
      </ErrorProvider>
    );
    
    expect(screen.queryByText('NETWORK')).toBeNull();
    expect(screen.queryByText('VALIDATION')).toBeNull();
  });

  it('should display network errors correctly', () => {
    render(
      <ErrorProvider>
        <ErrorDisplay />
        <TestErrorComponent />
      </ErrorProvider>
    );
    
    fireEvent.press(screen.getByTestId('add-error'));
    
    expect(screen.getByText('UNKNOWN')).toBeTruthy();
    expect(screen.getByText('Test error')).toBeTruthy();
  });

  it('should allow dismissing errors', () => {
    render(
      <ErrorProvider>
        <ErrorDisplay />
        <TestErrorComponent />
      </ErrorProvider>
    );
    
    fireEvent.press(screen.getByTestId('add-error'));
    
    const dismissButton = screen.getByTestId('dismiss-error');
    fireEvent.press(dismissButton);
    
    expect(screen.queryByText('Test error')).toBeNull();
  });
});

describe('useErrorHandler', () => {
  it('should handle errors correctly', () => {
    render(
      <ErrorProvider>
        <TestErrorHandlerComponent />
      </ErrorProvider>
    );
    
    fireEvent.press(screen.getByTestId('handle-error'));
    
    expect(screen.getByText('Test error')).toBeTruthy();
  });

  it('should handle network errors correctly', () => {
    render(
      <ErrorProvider>
        <TestErrorHandlerComponent />
      </ErrorProvider>
    );
    
    fireEvent.press(screen.getByTestId('handle-network-error'));
    
    expect(screen.getByText('Network error')).toBeTruthy();
  });

  it('should handle validation errors correctly', () => {
    render(
      <ErrorProvider>
        <TestErrorHandlerComponent />
      </ErrorProvider>
    );
    
    fireEvent.press(screen.getByTestId('handle-validation-error'));
    
    expect(screen.getByText('Validation error')).toBeTruthy();
  });

  it('should handle permission errors correctly', () => {
    render(
      <ErrorProvider>
        <TestErrorHandlerComponent />
      </ErrorProvider>
    );
    
    fireEvent.press(screen.getByTestId('handle-permission-error'));
    
    expect(screen.getByText('Permission error')).toBeTruthy();
  });
});

describe('useApiErrorHandler', () => {
  it('should handle API errors correctly', () => {
    render(
      <ErrorProvider>
        <TestApiErrorHandlerComponent />
      </ErrorProvider>
    );
    
    fireEvent.press(screen.getByTestId('handle-api-error'));
    
    expect(screen.getByText('API Error')).toBeTruthy();
  });

  it('should handle API calls with error handling', async () => {
    render(
      <ErrorProvider>
        <TestApiErrorHandlerComponent />
      </ErrorProvider>
    );
    
    fireEvent.press(screen.getByTestId('handle-api-call'));
    
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeTruthy();
    });
  });
});

describe('useNetworkError', () => {
  it('should add network errors correctly', () => {
    const TestNetworkErrorComponent = () => {
      const { addNetworkError, networkErrors } = useNetworkError();
      
      return (
        <div>
          <button 
            data-testid="add-network-error" 
            onClick={() => addNetworkError('Network error', 'TestContext')}
          >
            Add Network Error
          </button>
          <div data-testid="network-error-count">{networkErrors.length}</div>
        </div>
      );
    };

    render(
      <ErrorProvider>
        <TestNetworkErrorComponent />
      </ErrorProvider>
    );
    
    fireEvent.press(screen.getByTestId('add-network-error'));
    
    expect(screen.getByTestId('network-error-count')).toHaveTextContent('1');
  });
});

describe('useValidationError', () => {
  it('should add validation errors correctly', () => {
    const TestValidationErrorComponent = () => {
      const { addValidationError, validationErrors } = useValidationError();
      
      return (
        <div>
          <button 
            data-testid="add-validation-error" 
            onClick={() => addValidationError('Validation error', 'TestContext')}
          >
            Add Validation Error
          </button>
          <div data-testid="validation-error-count">{validationErrors.length}</div>
        </div>
      );
    };

    render(
      <ErrorProvider>
        <TestValidationErrorComponent />
      </ErrorProvider>
    );
    
    fireEvent.press(screen.getByTestId('add-validation-error'));
    
    expect(screen.getByTestId('validation-error-count')).toHaveTextContent('1');
  });
});

describe('usePermissionError', () => {
  it('should add permission errors correctly', () => {
    const TestPermissionErrorComponent = () => {
      const { addPermissionError, permissionErrors } = usePermissionError();
      
      return (
        <div>
          <button 
            data-testid="add-permission-error" 
            onClick={() => addPermissionError('Permission error', 'TestContext')}
          >
            Add Permission Error
          </button>
          <div data-testid="permission-error-count">{permissionErrors.length}</div>
        </div>
      );
    };

    render(
      <ErrorProvider>
        <TestPermissionErrorComponent />
      </ErrorProvider>
    );
    
    fireEvent.press(screen.getByTestId('add-permission-error'));
    
    expect(screen.getByTestId('permission-error-count')).toHaveTextContent('1');
  });
});

describe('Error Handling Integration', () => {
  it('should handle multiple error types correctly', () => {
    const TestMultipleErrorsComponent = () => {
      const { addError } = useErrorContext();
      const { addNetworkError } = useNetworkError();
      const { addValidationError } = useValidationError();
      const { addPermissionError } = usePermissionError();
      
      return (
        <div>
          <button 
            data-testid="add-all-errors" 
            onClick={() => {
              addError({ message: 'Unknown error', type: 'unknown' });
              addNetworkError('Network error');
              addValidationError('Validation error');
              addPermissionError('Permission error');
            }}
          >
            Add All Errors
          </button>
        </div>
      );
    };

    render(
      <ErrorProvider>
        <TestMultipleErrorsComponent />
      </ErrorProvider>
    );
    
    fireEvent.press(screen.getByTestId('add-all-errors'));
    
    expect(screen.getByText('Unknown error')).toBeTruthy();
    expect(screen.getByText('Network error')).toBeTruthy();
    expect(screen.getByText('Validation error')).toBeTruthy();
    expect(screen.getByText('Permission error')).toBeTruthy();
  });

  it('should handle retryable errors correctly', () => {
    const TestRetryableErrorComponent = () => {
      const { addError, retryError, errors } = useErrorContext();
      
      const addRetryableError = () => {
        addError({
          message: 'Retryable error',
          type: 'network',
          retryable: true,
          retryAction: async () => {
            console.log('Retrying...');
          },
        });
      };
      
      return (
        <div>
          <button 
            data-testid="add-retryable-error" 
            onClick={addRetryableError}
          >
            Add Retryable Error
          </button>
          <button 
            data-testid="retry-error" 
            onClick={() => retryError(errors[0]?.id || '')}
          >
            Retry Error
          </button>
        </div>
      );
    };

    render(
      <ErrorProvider>
        <TestRetryableErrorComponent />
      </ErrorProvider>
    );
    
    fireEvent.press(screen.getByTestId('add-retryable-error'));
    fireEvent.press(screen.getByTestId('retry-error'));
    
    // Error should be removed after retry
    expect(screen.queryByText('Retryable error')).toBeNull();
  });
});
