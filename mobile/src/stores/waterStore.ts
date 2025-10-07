/**
 * Water store using Zustand
 * Manages all water-related state and actions
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { WaterStore, WaterLog, WaterLogStats, WaterLogSummary } from './types';
import { waterService } from '../services/waterService';

// Initial state
const initialState = {
  todayStats: null,
  weekStats: null,
  recentWaterLogs: [],
  waterGoal: 3000, // Default 3L in ml
  loading: false,
  error: null,
  lastUpdated: null,
};

// Create the water store
export const useWaterStore = create<WaterStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Basic setters
      setTodayStats: (todayStats) => set({ todayStats }, false, 'setTodayStats'),
      setWeekStats: (weekStats) => set({ weekStats }, false, 'setWeekStats'),
      setRecentWaterLogs: (recentWaterLogs) => set({ recentWaterLogs }, false, 'setRecentWaterLogs'),
      setWaterGoal: (waterGoal) => set({ waterGoal }, false, 'setWaterGoal'),
      setLoading: (loading) => set({ loading }, false, 'setLoading'),
      setError: (error) => set({ error, loading: false }, false, 'setError'),

      // Water log management
      addWaterLog: (waterLog) => 
        set((state) => ({
          recentWaterLogs: [waterLog, ...state.recentWaterLogs],
          lastUpdated: new Date().toISOString(),
        }), false, 'addWaterLog'),

      updateWaterLog: (id, updatedWaterLog) =>
        set((state) => ({
          recentWaterLogs: state.recentWaterLogs.map(log =>
            log.id === id ? { ...log, ...updatedWaterLog } : log
          ),
          lastUpdated: new Date().toISOString(),
        }), false, 'updateWaterLog'),

      deleteWaterLog: (id) =>
        set((state) => ({
          recentWaterLogs: state.recentWaterLogs.filter(log => log.id !== id),
          lastUpdated: new Date().toISOString(),
        }), false, 'deleteWaterLog'),

      // Data refresh
      refreshWaterData: async () => {
        const { setLoading, setError, setTodayStats, setRecentWaterLogs } = get();
        
        try {
          setLoading(true);
          setError(null);

          // Fetch today's stats and logs in parallel
          const [todayStats, recentLogs] = await Promise.all([
            waterService.getWaterStats(),
            waterService.getTodaysWaterLogs(),
          ]);

          setTodayStats(todayStats);
          setRecentWaterLogs(recentLogs);
          
          // Update water goal from stats if available
          if (todayStats.goal_ml) {
            get().setWaterGoal(todayStats.goal_ml);
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch water data';
          setError(errorMessage);
          console.error('Water store refresh error:', error);
        } finally {
          setLoading(false);
        }
      },

      // Quick log water
      quickLogWater: async (amount_ml: number) => {
        const { setLoading, setError, addWaterLog, setTodayStats } = get();
        
        try {
          setLoading(true);
          setError(null);

          const result = await waterService.quickLogWater(amount_ml);
          
          // Add the new log to recent logs
          addWaterLog(result.log_entry);
          
          // Update today's stats
          setTodayStats(result.stats);

          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to log water';
          setError(errorMessage);
          console.error('Quick log water error:', error);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      // Create water log
      createWaterLog: async (waterLogData) => {
        const { setLoading, setError, addWaterLog, refreshWaterData } = get();
        
        try {
          setLoading(true);
          setError(null);

          const newLog = await waterService.createWaterLog(waterLogData);
          addWaterLog(newLog);
          
          // Refresh data to get updated stats
          await refreshWaterData();

          return newLog;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create water log';
          setError(errorMessage);
          console.error('Create water log error:', error);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      // Update water log
      updateWaterLogEntry: async (id: number, updateData) => {
        const { setLoading, setError, updateWaterLog, refreshWaterData } = get();
        
        try {
          setLoading(true);
          setError(null);

          const updatedLog = await waterService.updateWaterLog(id, updateData);
          updateWaterLog(id, updatedLog);
          
          // Refresh data to get updated stats
          await refreshWaterData();

          return updatedLog;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update water log';
          setError(errorMessage);
          console.error('Update water log error:', error);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      // Delete water log
      deleteWaterLogEntry: async (id: number) => {
        const { setLoading, setError, deleteWaterLog, refreshWaterData } = get();
        
        try {
          setLoading(true);
          setError(null);

          await waterService.deleteWaterLog(id);
          deleteWaterLog(id);
          
          // Refresh data to get updated stats
          await refreshWaterData();

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete water log';
          setError(errorMessage);
          console.error('Delete water log error:', error);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      // Get water logs for a specific period
      getWaterLogsForPeriod: async (days: number = 7) => {
        const { setLoading, setError, setWeekStats } = get();
        
        try {
          setLoading(true);
          setError(null);

          const logs = await waterService.getWaterLogs(days);
          
          // Calculate week stats from logs
          const totalMl = logs.reduce((sum, log) => sum + log.amount_ml, 0);
          const totalOz = logs.reduce((sum, log) => sum + log.amount_oz, 0);
          const logsCount = logs.length;
          const averagePerLog = logsCount > 0 ? totalMl / logsCount : 0;
          
          const weekStats: WaterLogSummary = {
            date: new Date().toISOString().split('T')[0],
            total_ml: totalMl,
            total_oz: totalOz,
            logs_count: logsCount,
            goal_achieved: totalMl >= get().waterGoal,
          };

          setWeekStats(weekStats);
          return logs;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch water logs';
          setError(errorMessage);
          console.error('Get water logs error:', error);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      // Reset water state
      resetWaterState: () => set(initialState, false, 'resetWaterState'),
    }),
    {
      name: 'water-store',
    }
  )
);

// Selector hooks for better performance
export const useWaterTodayStats = () => useWaterStore((state) => state.todayStats);
export const useWaterWeekStats = () => useWaterStore((state) => state.weekStats);
export const useRecentWaterLogs = () => useWaterStore((state) => state.recentWaterLogs);
export const useWaterGoal = () => useWaterStore((state) => state.waterGoal);
export const useWaterLoading = () => useWaterStore((state) => state.loading);
export const useWaterError = () => useWaterStore((state) => state.error);
export const useWaterLastUpdated = () => useWaterStore((state) => state.lastUpdated);

// Actions selector
export const useWaterActions = () => useWaterStore(
  (state) => ({
    refreshWaterData: state.refreshWaterData,
    quickLogWater: state.quickLogWater,
    createWaterLog: state.createWaterLog,
    updateWaterLogEntry: state.updateWaterLogEntry,
    deleteWaterLogEntry: state.deleteWaterLogEntry,
    getWaterLogsForPeriod: state.getWaterLogsForPeriod,
    setWaterGoal: state.setWaterGoal,
    resetWaterState: state.resetWaterState,
  }),
  shallow
);
