import { useState, useEffect, useCallback } from 'react';
import { fitnessLogsService, WorkoutLog, FitnessStats, CreateWorkoutLogData, UpdateWorkoutLogData } from '@/services/fitnessLogsService';
import { useSuccessToast, useErrorToast, useWarningToast } from '@/components/ui/toast';
import { logger } from '@/lib/logger';

export interface UseFitnessLogsOptions {
  refreshTrigger?: number;
  autoLoad?: boolean;
}

export interface UseFitnessLogsReturn {
  // Data
  logs: WorkoutLog[];
  stats: FitnessStats;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadLogs: () => Promise<void>;
  createLog: (logData: CreateWorkoutLogData) => Promise<WorkoutLog | null>;
  updateLog: (logId: string, updateData: UpdateWorkoutLogData) => Promise<WorkoutLog | null>;
  deleteLog: (logId: string) => Promise<boolean>;
  deleteMultipleLogs: (logIds: string[]) => Promise<boolean>;
  
  // State management
  setError: (error: string | null) => void;
  refreshLogs: () => Promise<void>;
}

export function useFitnessLogs(options: UseFitnessLogsOptions = {}): UseFitnessLogsReturn {
  const { refreshTrigger, autoLoad = true } = options;
  
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [stats, setStats] = useState<FitnessStats>({
    totalWorkouts: 0,
    totalDuration: 0,
    totalCalories: 0,
    averageDifficulty: 0,
    currentStreak: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toast hooks
  const successToast = useSuccessToast();
  const errorToast = useErrorToast();
  const warningToast = useWarningToast();

  /**
   * Load fitness logs from the API
   */
  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fitnessLogsService.loadLogs();
      setLogs(response.logs);
      setStats(response.stats);
      
      logger.debug('Fitness logs loaded successfully:', { 
        count: response.logs.length, 
        stats: response.stats 
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load workout logs';
      setError(errorMessage);
      errorToast('Loading Failed', 'Could not load your workout logs. Please try again.');
      logger.error('Failed to load fitness logs:', err);
    } finally {
      setLoading(false);
    }
  }, [errorToast]);

  /**
   * Create a new workout log
   */
  const createLog = useCallback(async (logData: CreateWorkoutLogData): Promise<WorkoutLog | null> => {
    try {
      setError(null);
      
      const newLog = await fitnessLogsService.createLog(logData);
      
      // Add the new log to the local state
      setLogs(prevLogs => [newLog, ...prevLogs]);
      
      // Refresh stats
      await loadLogs();
      
      successToast('Workout Logged', 'Your workout has been successfully logged.');
      logger.debug('Workout log created successfully:', newLog);
      
      return newLog;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create workout log';
      setError(errorMessage);
      errorToast('Logging Failed', 'Could not log your workout. Please try again.');
      logger.error('Failed to create workout log:', err);
      return null;
    }
  }, [successToast, errorToast, loadLogs]);

  /**
   * Update an existing workout log
   */
  const updateLog = useCallback(async (logId: string, updateData: UpdateWorkoutLogData): Promise<WorkoutLog | null> => {
    try {
      setError(null);
      
      const updatedLog = await fitnessLogsService.updateLog(logId, updateData);
      
      // Update the log in the local state
      setLogs(prevLogs => 
        prevLogs.map(log => 
          log.id === logId ? { ...log, ...updateData } : log
        )
      );
      
      // Refresh stats
      await loadLogs();
      
      successToast('Workout Updated', 'Your workout log has been successfully updated.');
      logger.debug('Workout log updated successfully:', updatedLog);
      
      return updatedLog;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update workout log';
      setError(errorMessage);
      errorToast('Update Failed', 'Could not update your workout log. Please try again.');
      logger.error('Failed to update workout log:', err);
      return null;
    }
  }, [successToast, errorToast, loadLogs]);

  /**
   * Delete a single workout log
   */
  const deleteLog = useCallback(async (logId: string): Promise<boolean> => {
    try {
      setError(null);
      
      await fitnessLogsService.deleteLog(logId);
      
      // Remove the log from local state
      setLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
      
      // Refresh stats
      await loadLogs();
      
      successToast('Workout Deleted', 'The workout log has been successfully deleted.');
      logger.debug('Workout log deleted successfully:', { logId });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete workout log';
      setError(errorMessage);
      errorToast('Delete Failed', 'Could not delete the workout log. Please try again.');
      logger.error('Failed to delete workout log:', err);
      return false;
    }
  }, [successToast, errorToast, loadLogs]);

  /**
   * Delete multiple workout logs
   */
  const deleteMultipleLogs = useCallback(async (logIds: string[]): Promise<boolean> => {
    if (logIds.length === 0) return true;
    
    try {
      setError(null);
      
      await fitnessLogsService.deleteMultipleLogs(logIds);
      
      // Remove the logs from local state
      setLogs(prevLogs => prevLogs.filter(log => !logIds.includes(log.id)));
      
      // Refresh stats
      await loadLogs();
      
      const count = logIds.length;
      successToast('Bulk Delete Complete', `${count} workout log${count > 1 ? 's' : ''} deleted successfully.`);
      logger.debug('Multiple workout logs deleted successfully:', { logIds });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete workout logs';
      setError(errorMessage);
      errorToast('Bulk Delete Failed', 'Could not delete some workout logs. Please try again.');
      logger.error('Failed to delete multiple workout logs:', err);
      return false;
    }
  }, [successToast, errorToast, loadLogs]);

  /**
   * Refresh logs (alias for loadLogs)
   */
  const refreshLogs = useCallback(async () => {
    await loadLogs();
  }, [loadLogs]);

  // Auto-load logs on mount
  useEffect(() => {
    if (autoLoad) {
      loadLogs();
    }
  }, [loadLogs, autoLoad]);

  // Watch for refresh trigger
  useEffect(() => {
    if (refreshTrigger) {
      loadLogs();
    }
  }, [refreshTrigger, loadLogs]);

  return {
    // Data
    logs,
    stats,
    loading,
    error,
    
    // Actions
    loadLogs,
    createLog,
    updateLog,
    deleteLog,
    deleteMultipleLogs,
    
    // State management
    setError,
    refreshLogs
  };
}
