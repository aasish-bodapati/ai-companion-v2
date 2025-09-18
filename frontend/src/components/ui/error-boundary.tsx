'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <ExclamationTriangleIcon className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              </details>
            )}
            
            <div className="flex gap-2">
              <Button onClick={this.handleRetry} variant="outline" size="sm">
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="default" 
                size="sm"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    console.error('Error caught by useErrorHandler:', error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
}

// Error fallback component for specific error types
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorType?: 'network' | 'validation' | 'permission' | 'unknown';
}

export function ErrorFallback({ error, resetError, errorType = 'unknown' }: ErrorFallbackProps) {
  const getErrorMessage = () => {
    switch (errorType) {
      case 'network':
        return {
          title: 'Connection Error',
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
          action: 'Retry Connection'
        };
      case 'validation':
        return {
          title: 'Invalid Input',
          message: 'Please check your input and try again.',
          action: 'Fix Input'
        };
      case 'permission':
        return {
          title: 'Access Denied',
          message: 'You don\'t have permission to perform this action.',
          action: 'Go Back'
        };
      default:
        return {
          title: 'Something went wrong',
          message: 'An unexpected error occurred. Please try again.',
          action: 'Try Again'
        };
    }
  };

  const { title, message, action } = getErrorMessage();

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <ExclamationTriangleIcon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          {message}
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              Error Details (Development)
            </summary>
            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
              <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap">
                {error.message}
                {error.stack}
              </pre>
            </div>
          </details>
        )}
        
        <Button onClick={resetError} variant="default" size="sm">
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          {action}
        </Button>
      </CardContent>
    </Card>
  );
}

// Higher-order component for error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}
