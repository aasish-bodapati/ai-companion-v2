import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrophyIcon, PlusIcon } from '@heroicons/react/24/outline';

interface FitnessLogsEmptyStateProps {
  onAddWorkout: () => void;
  className?: string;
}

export function FitnessLogsEmptyState({ onAddWorkout, className = '' }: FitnessLogsEmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="p-8 text-center">
        <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Workout Logs Found</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Start logging your workouts to see your progress here!
        </p>
        <Button 
          onClick={onAddWorkout}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Log Your First Workout
        </Button>
      </CardContent>
    </Card>
  );
}
