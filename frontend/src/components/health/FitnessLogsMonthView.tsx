import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ClockIcon, 
  FireIcon, 
  PencilIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { WorkoutLog } from '@/services/fitnessLogsService';
import { formatDuration, getWorkoutDisplayName, hasExerciseDetails } from '@/utils/fitnessLogsUtils';

interface FitnessLogsMonthViewProps {
  calendarDays: Date[];
  currentMonth: Date;
  logs: WorkoutLog[];
  expandedDates: Set<string>;
  isBulkDeleteMode: boolean;
  selectedLogs: Set<string>;
  onToggleDateExpansion: (dateStr: string) => void;
  onEditLog: (log: WorkoutLog) => void;
  onDeleteLog: (logId: string) => void;
  onToggleLogSelection: (logId: string) => void;
  getLogsForDate: (date: Date) => WorkoutLog[];
  getDateStats: (date: Date) => {
    totalDuration: number;
    totalCalories: number;
    count: number;
  };
  className?: string;
}

export function FitnessLogsMonthView({
  calendarDays,
  currentMonth,
  logs,
  expandedDates,
  isBulkDeleteMode,
  selectedLogs,
  onToggleDateExpansion,
  onEditLog,
  onDeleteLog,
  onToggleLogSelection,
  getLogsForDate,
  getDateStats,
  className = ''
}: FitnessLogsMonthViewProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
          {calendarDays.map((date, index) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayLogs = getLogsForDate(date);
            const dayStats = getDateStats(date);
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const isExpanded = expandedDates.has(dateStr);
            
            return (
              <div key={index} className="bg-white dark:bg-gray-800 min-h-[100px] p-2">
                <div className="flex flex-col h-full">
                  {/* Date Number */}
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentMonth 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-400 dark:text-gray-600'
                  } ${isToday ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded px-1' : ''}`}>
                    {date.getDate()}
                  </div>
                  
                  {/* Workout Count Badge */}
                  {dayLogs.length > 0 && (
                    <div className="flex-1 flex flex-col">
                      <Badge 
                        variant="secondary" 
                        className="text-xs mb-1 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                        onClick={() => onToggleDateExpansion(dateStr)}
                      >
                        {dayLogs.length} workout{dayLogs.length !== 1 ? 's' : ''}
                      </Badge>
                      
                      {/* Quick Stats */}
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                          <span>{formatDuration(dayStats.totalDuration)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FireIcon className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                          <span>{dayStats.totalCalories}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded Date Details */}
      {Array.from(expandedDates).map((dateStr) => {
        const date = new Date(dateStr);
        const dayLogs = getLogsForDate(date);
        const dayStats = getDateStats(date);
        
        return (
          <Card key={dateStr} className="mt-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {format(date, 'EEEE, MMMM d, yyyy')}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleDateExpansion(dateStr)}
                >
                  Close
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <Badge variant="outline">
                  {dayLogs.length} workout{dayLogs.length !== 1 ? 's' : ''}
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
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dayLogs.map((log) => (
                  <div key={log.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-3">
                    {/* Compact workout row - Efficient space usage */}
                    <div className="flex items-center gap-4">
                      {/* Bulk delete checkbox */}
                      {isBulkDeleteMode && (
                        <input
                          type="checkbox"
                          checked={selectedLogs.has(log.id)}
                          onChange={() => onToggleLogSelection(log.id)}
                          className="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 flex-shrink-0"
                        />
                      )}
                      
                      {/* Workout name and routine */}
                      <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {getWorkoutDisplayName(log)}
                        </h4>
                        {log.routine_name && log.workout_name !== log.routine_name && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            {log.routine_name}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Exercise details - using middle space */}
                      <div className="flex-1 min-w-0">
                        {hasExerciseDetails(log) ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                {log.exercises!.length} exercise{log.exercises!.length > 1 ? 's' : ''}
                              </span>
                              {log.duration_minutes && (
                                <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                                  <ClockIcon className="h-3 w-3" />
                                  {formatDuration(log.duration_minutes)}
                                </span>
                              )}
                              {log.calories_burned && (
                                <span className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
                                  <FireIcon className="h-3 w-3" />
                                  {log.calories_burned} cal
                                </span>
                              )}
                            </div>
                            {/* Exercise details */}
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {log.exercises!.slice(0, 2).map((exercise, index) => (
                                <div key={index} className="truncate">
                                  {exercise.exercise_name}: {exercise.sets}×{exercise.reps}
                                  {exercise.weight_used && ` @ ${exercise.weight_used}${log.unit || 'kg'}`}
                                </div>
                              ))}
                              {log.exercises!.length > 2 && (
                                <div className="text-gray-500 dark:text-gray-500">
                                  +{log.exercises!.length - 2} more exercises
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded text-xs">
                            No exercises logged
                          </span>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => onEditLog(log)}
                          className="h-7 w-7 p-0 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors border border-gray-200 dark:border-gray-500"
                        >
                          <PencilIcon className="h-3.5 w-3.5 text-gray-600 dark:text-white" />
                        </button>
                        <button
                          onClick={() => onDeleteLog(log.id)}
                          className="h-7 w-7 p-0 flex items-center justify-center rounded bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-200 dark:border-red-800"
                        >
                          <TrashIcon className="h-3.5 w-3.5 text-red-600 dark:text-red-300" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Exercise details - compact */}
                    {hasExerciseDetails(log) && (
                      <div className="mt-2 ml-7">
                        <div className="flex flex-wrap gap-1">
                          {log.exercises!.map((exercise, index) => (
                            <div key={index} className="text-xs bg-white dark:bg-gray-800 rounded px-2 py-1 border border-gray-200 dark:border-gray-600">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {exercise.exercise_name}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400 ml-1">
                                ({exercise.sets}×{exercise.reps}
                                {exercise.weight_used && ` @ ${exercise.weight_used}${log.unit || 'kg'}`})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Workout notes */}
                    {log.notes && (
                      <div className="mt-2 ml-7">
                        <div className="text-xs bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1">
                          <span className="font-medium text-blue-700 dark:text-blue-300">Notes: </span>
                          <span className="text-blue-600 dark:text-blue-400">{log.notes}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
