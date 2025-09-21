'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, ClockIcon, FireIcon, TrophyIcon, ChartBarIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { useSuccessToast, useErrorToast, useWarningToast } from '@/components/ui/toast';
import { logger } from '@/lib/logger';
import { AnimatedButton, AnimatedCard, AnimatedCounter } from '@/components/ui/micro-interactions';
import { LoadingOverlay, WorkoutCardSkeleton, CalendarSkeleton, StatsCardSkeleton } from '@/components/ui/loading-states';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import api from '@/lib/api';
import { DynamicWorkoutLogger } from './DynamicWorkoutLogger';

interface WorkoutLog {
  id: string;
  user_id: string;
  routine_id?: string;
  routine_name?: string;
  workout_name?: string;
  exercises?: Array<{
    exercise_name: string;
    sets: number;
    reps: string;
    weight_used?: number;
    notes?: string;
  }>;
  duration_minutes?: number;
  calories_burned?: number;
  difficulty_rating?: number;
  notes?: string;
  logged_at?: string;
  activity_date?: string;
  created_at: string;
}

interface FitnessLogsViewProps {
  className?: string;
  refreshTrigger?: number; // Add refresh trigger prop
}

function FitnessLogsView({ className = '', refreshTrigger }: FitnessLogsViewProps) {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalDuration: 0,
    totalCalories: 0,
    averageDifficulty: 0,
    currentStreak: 0
  });
  const [error, setError] = useState<string | null>(null);

  // Toast hooks
  const successToast = useSuccessToast();
  const errorToast = useErrorToast();
  const warningToast = useWarningToast();

  // CRUD state
  const [editingLog, setEditingLog] = useState<WorkoutLog | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    activity_name: '',
    duration_minutes: 0,
    calories_burned: 0,
    notes: '',
    activity_type: 'weightlifting' as string
  });

  // Bulk deletion state
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Load fitness logs with timezone offset
      const timezoneOffset = new Date().getTimezoneOffset();
      const response = await api.get(`/health/fitness-logs/?period=month&size=50`, { timeoutMs: 10000 });
      
      // Handle both old and new API response formats
      if (response.logs) {
        setLogs(response.logs || []);
        setStats(response.stats || {});
      } else if (Array.isArray(response)) {
        // Old API format - direct array
        setLogs(response || []);
        setStats({
          totalWorkouts: 0,
          totalDuration: 0,
          totalCalories: 0,
          averageDifficulty: 0,
          currentStreak: 0
        });
      } else {
        setLogs([]);
        setStats({
          totalWorkouts: 0,
          totalDuration: 0,
          totalCalories: 0,
          averageDifficulty: 0,
          currentStreak: 0
        });
      }
    } catch (error) {
      console.error('Failed to load fitness logs:', error);
      setError('Failed to load workout logs');
      errorToast('Loading Failed', 'Could not load your workout logs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [errorToast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Watch for refresh trigger
  useEffect(() => {
    if (refreshTrigger) {
      loadLogs();
    }
  }, [refreshTrigger, loadLogs]);

  // Always default to today when component loads
  useEffect(() => {
    setCurrentDay(new Date());
  }, []);

  const getDifficultyColor = (rating: number) => {
    if (rating <= 3) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (rating <= 6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  // CRUD Functions
  const handleEditLog = (log: WorkoutLog) => {
    setEditingLog(log);
    setEditFormData({
      activity_name: log.workout_name || log.routine_name || '',
      duration_minutes: log.duration_minutes || 0,
      calories_burned: log.calories_burned || 0,
      notes: log.notes || '',
      activity_type: 'weightlifting' // Default for now
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this workout log?')) return;
    
    try {
      await api.delete(`/health/logging/fitness/${logId}`);
      setLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
      successToast('Workout Deleted', 'The workout log has been successfully deleted.');
      loadLogs(); // Refresh stats
    } catch (error) {
      console.error('Failed to delete workout log:', error);
      errorToast('Delete Failed', 'Could not delete the workout log. Please try again.');
    }
  };

  // Bulk deletion functions
  const toggleLogSelection = (logId: string) => {
    setSelectedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const selectAllLogs = () => {
    const currentLogs = viewMode === 'day' ? getLogsForCurrentDay() : logs;
    setSelectedLogs(new Set(currentLogs.map(log => log.id)));
  };

  const clearSelection = () => {
    setSelectedLogs(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedLogs.size === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    const logsToDelete = selectedLogs.size;
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    
    try {
      // Delete all selected logs
      const deletePromises = Array.from(selectedLogs).map(logId => 
        api.delete(`/health/logging/fitness/${logId}`)
      );
      
      await Promise.all(deletePromises);
      
      // Update local state immediately
      setLogs(prevLogs => prevLogs.filter(log => !selectedLogs.has(log.id)));
      setSelectedLogs(new Set());
      setIsBulkDeleteMode(false);
      
      successToast('Bulk Delete Complete', `${logsToDelete} workout log${logsToDelete > 1 ? 's' : ''} deleted successfully.`);
      
      // Refresh stats
      loadLogs();
    } catch (error) {
      console.error('Failed to delete workout logs:', error);
      errorToast('Bulk Delete Failed', 'Could not delete some workout logs. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelBulkDelete = () => {
    setShowDeleteConfirm(false);
  };

  const toggleBulkDeleteMode = () => {
    setIsBulkDeleteMode(!isBulkDeleteMode);
    if (isBulkDeleteMode) {
      setSelectedLogs(new Set());
    }
  };

  const handleUpdateLog = async () => {
    if (!editingLog) return;

    try {
      const updateData = {
        activity_name: editFormData.activity_name,
        duration_minutes: editFormData.duration_minutes,
        calories_burned: editFormData.calories_burned,
        notes: editFormData.notes,
        activity_type: editFormData.activity_type
      };

      await api.put(`/health/logging/fitness/${editingLog.id}`, updateData);
      
      // Update the log in the local state
      setLogs(logs.map(log => 
        log.id === editingLog.id 
          ? { ...log, ...updateData }
          : log
      ));
      
      setIsEditDialogOpen(false);
      setEditingLog(null);
      logger.debug('Workout log updated successfully');
      loadLogs(); // Refresh stats
    } catch (error) {
      console.error('Failed to update workout log:', error);
      console.error('Failed to update workout log');
    }
  };

  const handleAddLog = async () => {
    try {
      const newLogData = {
        activity_name: editFormData.activity_name,
        duration_minutes: editFormData.duration_minutes,
        calories_burned: editFormData.calories_burned,
        notes: editFormData.notes,
        activity_type: editFormData.activity_type,
        activity_date: currentDay.toISOString()
      };

      const response = await api.post('/health/logging/fitness', newLogData);
      
      // Add the new log to the local state
      setLogs([response, ...logs]);
      
      setIsAddDialogOpen(false);
      setEditFormData({
        activity_name: '',
        duration_minutes: 0,
        calories_burned: 0,
        notes: '',
        activity_type: 'weightlifting'
      });
      logger.debug('Workout log added successfully');
      loadLogs(); // Refresh stats
    } catch (error) {
      console.error('Failed to add workout log:', error);
      console.error('Failed to add workout log');
    }
  };

  const getDifficultyText = (rating: number) => {
    if (rating <= 3) return 'Easy';
    if (rating <= 6) return 'Medium';
    return 'Hard';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };


  const getLogsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return logs.filter(log => {
      // Check both logged_at and activity_date fields
      const logDate = log.logged_at || log.activity_date || log.created_at;
      if (!logDate) return false;
      
      // Convert log date to local date for comparison
      let logDateStr;
      if (logDate.includes('T')) {
        // ISO string - convert to local date
        const logDateObj = new Date(logDate);
        // Use the same formatting logic as the current date
        const year = logDateObj.getFullYear();
        const month = String(logDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(logDateObj.getDate()).padStart(2, '0');
        logDateStr = `${year}-${month}-${day}`;
      } else {
        // Date string - use as is
        logDateStr = logDate.split(' ')[0];
      }
      
      // Special handling for timezone differences
      // If the log was created on the previous day in UTC but it's the current day locally,
      // consider it as part of the current day
      const currentDate = new Date();
      const isToday = dateStr === format(currentDate, 'yyyy-MM-dd');
      
      if (isToday) {
        // For today's logs, also check if the log was created within the last 24 hours
        const logDateObj = new Date(logDate);
        const hoursDiff = (currentDate.getTime() - logDateObj.getTime()) / (1000 * 60 * 60);
        
        // If the log was created within the last 24 hours, consider it as today's log
        if (hoursDiff <= 24 && hoursDiff >= 0) {
          return true;
        }
      }
      
      return logDateStr === dateStr;
    });
  };

  const getDateStats = (date: Date) => {
    const dayLogs = getLogsForDate(date);
    const totalDuration = dayLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
    const totalCalories = dayLogs.reduce((sum, log) => sum + (log.calories_burned || 0), 0);
    return { totalDuration, totalCalories, count: dayLogs.length };
  };


  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDay(prev => direction === 'next' ? addDays(prev, 1) : subDays(prev, 1));
  };

  const getLogsForCurrentDay = () => {
    return getLogsForDate(currentDay);
  };

  const getCurrentDayStats = () => {
    return getDateStats(currentDay);
  };

  // Month view helper functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'next') {
        newMonth.setMonth(newMonth.getMonth() + 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() - 1);
      }
      return newMonth;
    });
  };

  const toggleDateExpansion = (dateStr: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateStr)) {
        newSet.delete(dateStr);
      } else {
        newSet.add(dateStr);
      }
      return newSet;
    });
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  if (loading) {
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
                <WorkoutCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <CalendarSkeleton />
          )}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`space-y-6 ${className}`}>
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="font-medium">Error: {error}</span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Please try refreshing the page or contact support if the problem persists.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Workout Logs</h2>
        </div>

        {/* View Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
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
              onClick={() => setViewMode('month')}
              className={`${
                viewMode === 'month' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white dark:border-blue-600' 
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600'
              } font-medium transition-all duration-200 shadow-sm`}
            >
              Month View
            </Button>
          </div>
          
          {viewMode === 'day' && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setIsAddDialogOpen(true)}
                className="flex items-center gap-1"
              >
                <PlusIcon className="h-4 w-4" />
                Add Workout
              </Button>
              
              {/* Bulk Delete Controls */}
              <Button
                size="sm"
                variant={isBulkDeleteMode ? "destructive" : "outline"}
                onClick={toggleBulkDeleteMode}
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
                    onClick={selectAllLogs}
                    className="flex items-center gap-1"
                  >
                    Select All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearSelection}
                    className="flex items-center gap-1"
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkDelete}
                    disabled={selectedLogs.size === 0 || isDeleting}
                    className="flex items-center gap-1"
                  >
                    {isDeleting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                    Delete ({selectedLogs.size})
                  </Button>
                </>
              )}
            </div>
          )}

          {viewMode === 'month' && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setIsAddDialogOpen(true)}
                className="flex items-center gap-1"
              >
                <PlusIcon className="h-4 w-4" />
                Add Workout
              </Button>
              
              {/* Bulk Delete Controls */}
              <Button
                size="sm"
                variant={isBulkDeleteMode ? "destructive" : "outline"}
                onClick={toggleBulkDeleteMode}
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
                    onClick={selectAllLogs}
                    className="flex items-center gap-1"
                  >
                    Select All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearSelection}
                    className="flex items-center gap-1"
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkDelete}
                    disabled={selectedLogs.size === 0 || isDeleting}
                    className="flex items-center gap-1"
                  >
                    {isDeleting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                    Delete ({selectedLogs.size})
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>



      {/* Day Navigation - Always show in day view */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          {/* Day Navigation */}
          <div className="flex items-center justify-center gap-4 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDay('prev')}
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
                onClick={() => setCurrentDay(new Date())}
                className="text-xs px-2 py-1"
              >
                Today
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDay('next')}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Day Stats Summary */}
          <div className="flex items-center justify-center py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <Badge variant="outline" className="text-xs">
                {getCurrentDayStats().count} workout{getCurrentDayStats().count !== 1 ? 's' : ''}
              </Badge>
              <div className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span>{formatDuration(getCurrentDayStats().totalDuration)}</span>
              </div>
              <div className="flex items-center gap-1">
                <FireIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span>{getCurrentDayStats().totalCalories} cal</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs List */}
      <div className="space-y-4">
        {logs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Workout Logs Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start logging your workouts to see your progress here!
              </p>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Log Your First Workout
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === 'day' ? (
          <div className="space-y-6">

          {/* Workouts for current day - Clean Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {getLogsForCurrentDay().length > 0 ? (
              getLogsForCurrentDay().map((log) => (
                <div key={log.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* Bulk delete checkbox */}
                      {isBulkDeleteMode && (
                        <input
                          type="checkbox"
                          checked={selectedLogs.has(log.id)}
                          onChange={() => toggleLogSelection(log.id)}
                          className="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                          {log.workout_name || log.routine_name || 'Custom Workout'}
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
                        onClick={() => handleEditLog(log)}
                        className="h-7 w-7 p-0 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4 text-gray-600 dark:text-white" />
                      </button>
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="h-7 w-7 p-0 flex items-center justify-center rounded bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4 text-red-600 dark:text-red-300" />
                      </button>
                    </div>
                  </div>

                  {/* Workout Summary */}
                  <div className="space-y-2 mb-3">
                    {log.exercises && log.exercises.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Exercises:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{log.exercises.length}</span>
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
                  {log.exercises && log.exercises.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">Exercise Details</div>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {log.exercises.length} exercise{log.exercises.length > 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="space-y-3">
                        {log.exercises.slice(0, 4).map((exercise, index) => (
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
                        {log.exercises.length > 4 && (
                          <div className="text-center py-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              +{log.exercises.length - 4} more exercise{log.exercises.length - 4 > 1 ? 's' : ''}
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
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                <TrophyIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Workouts This Day</h3>
                <p className="text-sm">No workouts logged for {format(currentDay, 'MMMM d, yyyy')}</p>
              </div>
            )}
          </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Month Navigation Header */}
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
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
                onClick={() => navigateMonth('next')}
                className="flex items-center gap-1 text-sm"
              >
                Next Month
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>

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
                {getCalendarDays().map((date, index) => {
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
                              onClick={() => toggleDateExpansion(dateStr)}
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
                        onClick={() => toggleDateExpansion(dateStr)}
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
                        <span>{formatDuration(getDateStats(date).totalDuration)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FireIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span>{getDateStats(date).totalCalories} cal</span>
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
                                onChange={() => toggleLogSelection(log.id)}
                                className="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 flex-shrink-0"
                              />
                            )}
                            
                            {/* Workout name and routine */}
                            <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {log.workout_name || log.routine_name || 'Custom Workout'}
                              </h4>
                              {log.routine_name && log.workout_name !== log.routine_name && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                  {log.routine_name}
                                </Badge>
                              )}
                            </div>
                            
                            {/* Exercise details - using middle space */}
                            <div className="flex-1 min-w-0">
                              {log.exercises && log.exercises.length > 0 ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                      {log.exercises.length} exercise{log.exercises.length > 1 ? 's' : ''}
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
                                    {log.exercises.slice(0, 2).map((exercise, index) => (
                                      <div key={index} className="truncate">
                                        {exercise.exercise_name}: {exercise.sets}×{exercise.reps}
                                        {exercise.weight_used && ` @ ${exercise.weight_used}kg`}
                                      </div>
                                    ))}
                                    {log.exercises.length > 2 && (
                                      <div className="text-gray-500 dark:text-gray-500">
                                        +{log.exercises.length - 2} more exercises
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
                                onClick={() => handleEditLog(log)}
                                className="h-7 w-7 p-0 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors border border-gray-200 dark:border-gray-500"
                              >
                                <PencilIcon className="h-3.5 w-3.5 text-gray-600 dark:text-white" />
                              </button>
                              <button
                                onClick={() => handleDeleteLog(log.id)}
                                className="h-7 w-7 p-0 flex items-center justify-center rounded bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-200 dark:border-red-800"
                              >
                                <TrashIcon className="h-3.5 w-3.5 text-red-600 dark:text-red-300" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Exercise details - compact */}
                          {log.exercises && log.exercises.length > 0 && (
                            <div className="mt-2 ml-7">
                              <div className="flex flex-wrap gap-1">
                                {log.exercises.map((exercise, index) => (
                                  <div key={index} className="text-xs bg-white dark:bg-gray-800 rounded px-2 py-1 border border-gray-200 dark:border-gray-600">
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {exercise.exercise_name}
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400 ml-1">
                                      ({exercise.sets}×{exercise.reps}
                                      {exercise.weight_used && ` @ ${exercise.weight_used}kg`})
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
        )}
      </div>

      {/* Edit Workout Dialog - Using SmartWorkoutLogger for consistency */}
      <DynamicWorkoutLogger 
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingLog(null);
        }}
        onSuccess={() => {
          setIsEditDialogOpen(false);
          setEditingLog(null);
          loadLogs(); // Refresh the logs
        }}
        initialData={editingLog ? {
          workout_name: editingLog.workout_name || editingLog.routine_name || 'Custom Workout',
          duration_minutes: editingLog.duration_minutes || 0,
          calories_burned: editingLog.calories_burned || 0,
          notes: editingLog.notes || '',
          exercises: editingLog.exercises || []
        } : undefined}
      />

      {/* Add Workout Dialog - Using DynamicWorkoutLogger */}
      <DynamicWorkoutLogger 
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={() => {
          setIsAddDialogOpen(false);
          loadLogs(); // Refresh the logs
        }}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete {selectedLogs.size} workout log{selectedLogs.size > 1 ? 's' : ''}?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelBulkDelete}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </div>
              ) : (
                `Delete ${selectedLogs.size} Log${selectedLogs.size > 1 ? 's' : ''}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </ErrorBoundary>
  );
}

export default FitnessLogsView;
