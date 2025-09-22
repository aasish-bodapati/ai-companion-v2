import React from 'react';
import { ErrorBoundary } from './error-boundary';
import { LoadingSpinner } from './loading-states';

export interface DataViewContainerProps {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
  className?: string;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  isEmpty?: boolean;
}

export function DataViewContainer({
  loading = false,
  error = null,
  onRetry,
  children,
  className = '',
  loadingComponent,
  errorComponent,
  emptyComponent,
  isEmpty = false
}: DataViewContainerProps) {
  // Show loading state
  if (loading) {
    return (
      <div className={className}>
        {loadingComponent || (
          <LoadingSpinner text="Loading data..." />
        )}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={className}>
        {errorComponent || (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Show empty state
  if (isEmpty) {
    return (
      <div className={className}>
        {emptyComponent || (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No data available</p>
          </div>
        )}
      </div>
    );
  }

  // Show main content
  return (
    <ErrorBoundary>
      <div className={className}>
        {children}
      </div>
    </ErrorBoundary>
  );
}
