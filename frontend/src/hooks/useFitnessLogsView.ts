import { useState, useCallback } from 'react';
import { addDays, subDays, format } from 'date-fns';
import { WorkoutLog } from '@/services/fitnessLogsService';

export type ViewMode = 'day' | 'month';

export interface UseFitnessLogsViewOptions {
  initialViewMode?: ViewMode;
  initialDate?: Date;
}

export interface UseFitnessLogsViewReturn {
  // View state
  viewMode: ViewMode;
  currentDay: Date;
  currentMonth: Date;
  expandedDates: Set<string>;
  
  // View actions
  setViewMode: (mode: ViewMode) => void;
  navigateDay: (direction: 'prev' | 'next') => void;
  navigateMonth: (direction: 'prev' | 'next') => void;
  setCurrentDay: (date: Date) => void;
  setCurrentMonth: (date: Date) => void;
  toggleDateExpansion: (dateStr: string) => void;
  goToToday: () => void;
  
  // Data helpers
  getLogsForDate: (date: Date, logs: WorkoutLog[]) => WorkoutLog[];
  getLogsForCurrentDay: (logs: WorkoutLog[]) => WorkoutLog[];
  getDateStats: (date: Date, logs: WorkoutLog[]) => {
    totalDuration: number;
    totalCalories: number;
    count: number;
  };
  getCurrentDayStats: (logs: WorkoutLog[]) => {
    totalDuration: number;
    totalCalories: number;
    count: number;
  };
  getCalendarDays: () => Date[];
}

export function useFitnessLogsView(options: UseFitnessLogsViewOptions = {}): UseFitnessLogsViewReturn {
  const { initialViewMode = 'day', initialDate = new Date() } = options;
  
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [currentDay, setCurrentDay] = useState(initialDate);
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  /**
   * Navigate to previous or next day
   */
  const navigateDay = useCallback((direction: 'prev' | 'next') => {
    setCurrentDay(prev => direction === 'next' ? addDays(prev, 1) : subDays(prev, 1));
  }, []);

  /**
   * Navigate to previous or next month
   */
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'next') {
        newMonth.setMonth(newMonth.getMonth() + 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() - 1);
      }
      return newMonth;
    });
  }, []);

  /**
   * Toggle expansion of a specific date in month view
   */
  const toggleDateExpansion = useCallback((dateStr: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateStr)) {
        newSet.delete(dateStr);
      } else {
        newSet.add(dateStr);
      }
      return newSet;
    });
  }, []);

  /**
   * Go to today's date
   */
  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDay(today);
    setCurrentMonth(today);
  }, []);

  /**
   * Get logs for a specific date
   */
  const getLogsForDate = useCallback((date: Date, logs: WorkoutLog[]): WorkoutLog[] => {
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
  }, []);

  /**
   * Get logs for the current day
   */
  const getLogsForCurrentDay = useCallback((logs: WorkoutLog[]): WorkoutLog[] => {
    return getLogsForDate(currentDay, logs);
  }, [currentDay, getLogsForDate]);

  /**
   * Get statistics for a specific date
   */
  const getDateStats = useCallback((date: Date, logs: WorkoutLog[]) => {
    const dayLogs = getLogsForDate(date, logs);
    const totalDuration = dayLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
    const totalCalories = dayLogs.reduce((sum, log) => sum + (log.calories_burned || 0), 0);
    return { totalDuration, totalCalories, count: dayLogs.length };
  }, [getLogsForDate]);

  /**
   * Get statistics for the current day
   */
  const getCurrentDayStats = useCallback((logs: WorkoutLog[]) => {
    return getDateStats(currentDay, logs);
  }, [currentDay, getDateStats]);

  /**
   * Get calendar days for the current month
   */
  const getCalendarDays = useCallback((): Date[] => {
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
  }, [currentMonth]);

  return {
    // View state
    viewMode,
    currentDay,
    currentMonth,
    expandedDates,
    
    // View actions
    setViewMode,
    navigateDay,
    navigateMonth,
    setCurrentDay,
    setCurrentMonth,
    toggleDateExpansion,
    goToToday,
    
    // Data helpers
    getLogsForDate,
    getLogsForCurrentDay,
    getDateStats,
    getCurrentDayStats,
    getCalendarDays
  };
}
