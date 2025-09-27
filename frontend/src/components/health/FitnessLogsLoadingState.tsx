import React from 'react';
import { StatsCardSkeleton, CardLoading } from '@/components/ui/loading-states';

interface FitnessLogsLoadingStateProps {
  viewMode: 'day' | 'month';
  className?: string;
}

export function FitnessLogsLoadingState({ viewMode, className = '' }: FitnessLogsLoadingStateProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Workout Logs</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <div className="space-y-4">
        {viewMode === 'day' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <CardLoading key={i} />
            ))}
          </div>
        ) : (
          <CardLoading />
        )}
      </div>
    </div>
  );
}
