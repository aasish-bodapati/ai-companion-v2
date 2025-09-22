import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ClockIcon, 
  FireIcon, 
  TrophyIcon, 
  PlusIcon 
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { WorkoutLog } from '@/services/fitnessLogsService';
import { WorkoutCard } from './WorkoutCard';
import { formatDuration } from '@/utils/fitnessLogsUtils';

interface FitnessLogsDayViewProps {
  logs: WorkoutLog[];
  currentDay: Date;
  dayStats: {
    totalDuration: number;
    totalCalories: number;
    count: number;
  };
  isBulkDeleteMode: boolean;
  selectedLogs: Set<string>;
  onEditLog: (log: WorkoutLog) => void;
  onDeleteLog: (logId: string) => void;
  onToggleLogSelection: (logId: string) => void;
  onAddWorkout: () => void;
  className?: string;
}

export function FitnessLogsDayView({
  logs,
  currentDay,
  dayStats,
  isBulkDeleteMode,
  selectedLogs,
  onEditLog,
  onDeleteLog,
  onToggleLogSelection,
  onAddWorkout,
  className = ''
}: FitnessLogsDayViewProps) {
  if (logs.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Day Stats Summary */}
        <div className="flex items-center justify-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <Badge variant="outline" className="text-xs">
              {dayStats.count} workout{dayStats.count !== 1 ? 's' : ''}
            </Badge>
            <div className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span>{formatDuration(dayStats.totalDuration)}</span>
            </div>
            <div className="flex items-center gap-1">
              <FireIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span>{dayStats.totalCalories} cal</span>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="p-8 text-center">
            <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Workouts This Day</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No workouts logged for {format(currentDay, 'MMMM d, yyyy')}
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
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Day Stats Summary */}
      <div className="flex items-center justify-center py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
          <Badge variant="outline" className="text-xs">
            {dayStats.count} workout{dayStats.count !== 1 ? 's' : ''}
          </Badge>
          <div className="flex items-center gap-1">
            <ClockIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span>{formatDuration(dayStats.totalDuration)}</span>
          </div>
          <div className="flex items-center gap-1">
            <FireIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span>{dayStats.totalCalories} cal</span>
          </div>
        </div>
      </div>

      {/* Workouts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {logs.map((log) => (
          <WorkoutCard
            key={log.id}
            log={log}
            isBulkDeleteMode={isBulkDeleteMode}
            isSelected={selectedLogs.has(log.id)}
            onEdit={onEditLog}
            onDelete={onDeleteLog}
            onToggleSelection={onToggleLogSelection}
          />
        ))}
      </div>
    </div>
  );
}
