import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  PlusIcon, 
  TrashIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarIcon 
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ViewMode } from '@/hooks/useFitnessLogsView';

interface FitnessLogsViewControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onAddWorkout: () => void;
  onBulkDelete: () => void;
  onToggleBulkDelete: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onNavigateDay: (direction: 'prev' | 'next') => void;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  onGoToToday: () => void;
  currentDay: Date;
  currentMonth: Date;
  isBulkDeleteMode: boolean;
  selectedCount: number;
  isDeleting: boolean;
  className?: string;
}

export function FitnessLogsViewControls({
  viewMode,
  onViewModeChange,
  onAddWorkout,
  onBulkDelete,
  onToggleBulkDelete,
  onSelectAll,
  onClearSelection,
  onNavigateDay,
  onNavigateMonth,
  onGoToToday,
  currentDay,
  currentMonth,
  isBulkDeleteMode,
  selectedCount,
  isDeleting,
  className = ''
}: FitnessLogsViewControlsProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Workout Logs</h2>
      </div>

      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('day')}
            className={`${
              viewMode === 'day' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white dark:border-blue-600' 
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600'
            } font-medium transition-all duration-200 shadow-sm`}
          >
            Day View
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('month')}
            className={`${
              viewMode === 'month' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white dark:border-blue-600' 
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600'
            } font-medium transition-all duration-200 shadow-sm`}
          >
            Month View
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onAddWorkout}
            className="flex items-center gap-1"
          >
            <PlusIcon className="h-4 w-4" />
            Add Workout
          </Button>
          
          {/* Bulk Delete Controls */}
          <Button
            size="sm"
            variant={isBulkDeleteMode ? "destructive" : "outline"}
            onClick={onToggleBulkDelete}
            className="flex items-center gap-1"
          >
            <TrashIcon className="h-4 w-4" />
            {isBulkDeleteMode ? 'Cancel' : 'Bulk Delete'}
          </Button>
          
          {isBulkDeleteMode && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={onSelectAll}
                className="flex items-center gap-1"
              >
                Select All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onClearSelection}
                className="flex items-center gap-1"
              >
                Clear
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={onBulkDelete}
                disabled={selectedCount === 0 || isDeleting}
                className="flex items-center gap-1"
              >
                {isDeleting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
                Delete ({selectedCount})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Day Navigation - Only show in day view */}
      {viewMode === 'day' && (
        <div className="flex items-center justify-center gap-4 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateDay('prev')}
            className="flex items-center gap-1"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <CalendarIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {format(currentDay, 'EEEE, MMM d, yyyy')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onGoToToday}
              className="text-xs px-2 py-1"
            >
              Today
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateDay('next')}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Month Navigation - Only show in month view */}
      {viewMode === 'month' && (
        <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateMonth('prev')}
            className="flex items-center gap-1 text-sm"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Prev Month
          </Button>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateMonth('next')}
            className="flex items-center gap-1 text-sm"
          >
            Next Month
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
