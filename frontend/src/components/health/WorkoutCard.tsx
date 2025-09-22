import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  PencilIcon, 
  TrashIcon, 
  ClockIcon, 
  FireIcon 
} from '@heroicons/react/24/outline';
import { WorkoutLog } from '@/services/fitnessLogsService';
import { 
  formatDuration, 
  getWorkoutDisplayName, 
  hasExerciseDetails, 
  getExerciseCountText,
  formatExerciseDetails 
} from '@/utils/fitnessLogsUtils';

interface WorkoutCardProps {
  log: WorkoutLog;
  isBulkDeleteMode: boolean;
  isSelected: boolean;
  onEdit: (log: WorkoutLog) => void;
  onDelete: (logId: string) => void;
  onToggleSelection: (logId: string) => void;
  className?: string;
}

export function WorkoutCard({
  log,
  isBulkDeleteMode,
  isSelected,
  onEdit,
  onDelete,
  onToggleSelection,
  className = ''
}: WorkoutCardProps) {
  const workoutName = getWorkoutDisplayName(log);
  const hasDetails = hasExerciseDetails(log);
  const exerciseCount = log.exercises?.length || 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow ${className}`}>
      {/* Card Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Bulk delete checkbox */}
          {isBulkDeleteMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelection(log.id)}
              className="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {workoutName}
            </h3>
            {log.routine_name && log.workout_name !== log.routine_name && (
              <Badge variant="secondary" className="text-xs px-2 py-1 mt-1">
                {log.routine_name}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => onEdit(log)}
            className="h-7 w-7 p-0 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <PencilIcon className="h-4 w-4 text-gray-600 dark:text-white" />
          </button>
          <button
            onClick={() => onDelete(log.id)}
            className="h-7 w-7 p-0 flex items-center justify-center rounded bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          >
            <TrashIcon className="h-4 w-4 text-red-600 dark:text-red-300" />
          </button>
        </div>
      </div>

      {/* Workout Summary */}
      <div className="space-y-2 mb-3">
        {hasDetails ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Exercises:</span>
              <span className="font-medium text-gray-900 dark:text-white">{exerciseCount}</span>
            </div>
            {log.duration_minutes && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatDuration(log.duration_minutes)}</span>
              </div>
            )}
            {log.calories_burned && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Calories:</span>
                <span className="font-medium text-gray-900 dark:text-white">{log.calories_burned}</span>
              </div>
            )}
          </>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium">No Exercise Details</span>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              This workout was logged without specific exercise information
            </p>
          </div>
        )}
      </div>

      {/* Exercise List - Only if exercises exist */}
      {hasDetails && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">Exercise Details</div>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {getExerciseCountText(exerciseCount)}
            </div>
          </div>
          <div className="space-y-3">
            {log.exercises!.slice(0, 4).map((exercise, index) => (
              <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="font-semibold text-gray-900 dark:text-white text-base">
                    {exercise.exercise_name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                    #{index + 1}
                  </div>
                </div>
                
                {/* Exercise Stats - More Prominent */}
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Sets</div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{exercise.sets}</div>
                  </div>
                  <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Reps</div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">{exercise.reps}</div>
                  </div>
                  <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Weight</div>
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {exercise.weight_used ? `${exercise.weight_used}kg` : 'N/A'}
                    </div>
                  </div>
                </div>
                
                {/* Exercise Notes */}
                {exercise.notes && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <div className="text-xs font-medium text-yellow-800 dark:text-yellow-200 uppercase tracking-wide mb-1">Notes</div>
                        <div className="text-sm text-yellow-700 dark:text-yellow-300 italic">
                          &ldquo;{exercise.notes}&rdquo;
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {exerciseCount > 4 && (
              <div className="text-center py-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  +{exerciseCount - 4} more exercise{exerciseCount - 4 > 1 ? 's' : ''}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Click edit to see all exercises
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Workout Notes */}
      {log.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1">Notes</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded px-3 py-2">
            {log.notes}
          </div>
        </div>
      )}
    </div>
  );
}
