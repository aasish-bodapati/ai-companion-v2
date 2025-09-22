import React from 'react';

interface FitnessLogsErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

export function FitnessLogsErrorDisplay({ error, onRetry, className = '' }: FitnessLogsErrorDisplayProps) {
  return (
    <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="font-medium">Error: {error}</span>
      </div>
      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
        Please try refreshing the page or contact support if the problem persists.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
